import { randomBytes, randomUUID } from "node:crypto";
import type { SMTPServer } from "smtp-server";
import index from "../client/index.html";
import type { Email, Inbox, SmtpConfig, WsMessage } from "../shared/types";
import { createSMTPServer } from "./smtp";
import { storage } from "./storage";

const HTTP_PORT = 3000;
const SMTP_PORT = 1025;

// --------------------------------------------------------------------------
// WebSocket broadcast
// --------------------------------------------------------------------------
const wsClients = new Set<{ send: (msg: string) => void }>();

function broadcast(msg: WsMessage) {
    const payload = JSON.stringify(msg);
    for (const ws of wsClients) {
        try {
            ws.send(payload);
        } catch {
            wsClients.delete(ws);
        }
    }
}

// --------------------------------------------------------------------------
// Shared SMTP server management
// --------------------------------------------------------------------------
let smtpServer: InstanceType<typeof SMTPServer> | null = null;

function startSmtpServer(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (smtpServer) {
            resolve();
            return;
        }

        const server = createSMTPServer((email: Email) => {
            broadcast({ type: "new_email", email });
        });

        server.listen(SMTP_PORT, (err?: Error) => {
            if (err) {
                console.error(
                    `[SMTP] Failed to start on port ${SMTP_PORT}:`,
                    err,
                );
                return reject(err);
            }
            console.log(`[SMTP] Listening on port ${SMTP_PORT}`);
            smtpServer = server;
            resolve();
        });
    });
}

function generateInboxUsername(name: string): string {
    const base =
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 24) || "inbox";

    let username = `${base}-${randomBytes(3).toString("hex")}`;
    while (storage.getInboxByUsername(username)) {
        username = `${base}-${randomBytes(3).toString("hex")}`;
    }
    return username;
}

startSmtpServer().catch(() => {
    console.error(`[SMTP] Could not bind to port ${SMTP_PORT}`);
});

// --------------------------------------------------------------------------
// HTTP + WebSocket server
// --------------------------------------------------------------------------
const server = Bun.serve({
    port: HTTP_PORT,

    routes: {
        // ── Frontend ──────────────────────────────────────────────────────────
        "/": index,

        // ── Emails ────────────────────────────────────────────────────────────
        "/api/emails": {
            GET(req) {
                const url = new URL(req.url);
                const page = parseInt(url.searchParams.get("page") ?? "1");
                const pageSize = parseInt(
                    url.searchParams.get("pageSize") ?? "20",
                );
                const inboxId = url.searchParams.get("inboxId") ?? undefined;
                const search = url.searchParams.get("search") ?? undefined;

                const result = storage.getEmails(
                    page,
                    pageSize,
                    inboxId,
                    search,
                );
                return Response.json({ ...result, page, pageSize });
            },
            async DELETE(req) {
                const url = new URL(req.url);
                const inboxId = url.searchParams.get("inboxId") ?? "default";
                const count = storage.clearInbox(inboxId);
                broadcast({ type: "inbox_cleared", inboxId });
                return Response.json({ deleted: count });
            },
        },

        "/api/emails/:id": {
            GET(req) {
                const email = storage.getEmail(req.params.id);
                if (!email) return new Response("Not found", { status: 404 });
                storage.markAsRead(req.params.id);
                return Response.json(email);
            },
            DELETE(req) {
                const deleted = storage.deleteEmail(req.params.id);
                if (!deleted) return new Response("Not found", { status: 404 });
                broadcast({ type: "email_deleted", id: req.params.id });
                return Response.json({ deleted: true });
            },
        },

        "/api/emails/:id/raw": {
            GET(req) {
                const email = storage.getEmail(req.params.id);
                if (!email) return new Response("Not found", { status: 404 });
                return new Response(email.raw, {
                    headers: { "Content-Type": "text/plain; charset=utf-8" },
                });
            },
        },

        "/api/emails/:id/attachments/:index": {
            GET(req) {
                const email = storage.getEmail(req.params.id);
                if (!email) return new Response("Not found", { status: 404 });

                const idx = parseInt(req.params.index);
                const att = email.attachments[idx];
                if (!att)
                    return new Response("Attachment not found", {
                        status: 404,
                    });

                const buf = Buffer.from(att.content, "base64");
                return new Response(buf, {
                    headers: {
                        "Content-Type": att.contentType,
                        "Content-Disposition": `attachment; filename="${att.filename}"`,
                    },
                });
            },
        },

        // ── Inboxes ───────────────────────────────────────────────────────────
        "/api/inboxes": {
            GET() {
                return Response.json(storage.getInboxes());
            },
            async POST(req) {
                const body = (await req.json()) as { name?: string };
                const name = body.name?.trim();
                if (!name) {
                    return Response.json(
                        { error: "Name is required" },
                        { status: 400 },
                    );
                }

                const inbox: Inbox = {
                    id: randomUUID(),
                    name,
                    emailCount: 0,
                    unreadCount: 0,
                    createdAt: new Date().toISOString(),
                    smtp: {
                        port: SMTP_PORT,
                        username: generateInboxUsername(name),
                        password: randomBytes(8).toString("hex"),
                    },
                };

                storage.addInbox(inbox);
                return Response.json(inbox, { status: 201 });
            },
        },

        "/api/inboxes/:id": {
            async PATCH(req) {
                const body = (await req.json()) as Partial<{
                    name: string;
                    smtp: SmtpConfig;
                }>;
                const inboxId = req.params.id;

                if (body.smtp) {
                    const current = storage.getInbox(inboxId);
                    if (!current)
                        return new Response("Not found", { status: 404 });

                    if (body.smtp.port !== SMTP_PORT) {
                        return Response.json(
                            { error: `SMTP port is fixed to ${SMTP_PORT}` },
                            { status: 400 },
                        );
                    }

                    if (
                        body.smtp.username &&
                        body.smtp.username !== current.smtp.username &&
                        storage.getInboxByUsername(body.smtp.username)
                    ) {
                        return Response.json(
                            {
                                error: `Username ${body.smtp.username} is already in use by another inbox`,
                            },
                            { status: 409 },
                        );
                    }

                    const updated = storage.updateInboxSmtp(inboxId, {
                        port: SMTP_PORT,
                        username: body.smtp.username ?? current.smtp.username,
                        password: body.smtp.password ?? current.smtp.password,
                    });
                    if (!updated)
                        return new Response("Not found", { status: 404 });

                    return Response.json(updated);
                }

                return new Response("Nothing to update", { status: 400 });
            },
            async DELETE(req) {
                const deleted = storage.deleteInbox(req.params.id);
                if (!deleted)
                    return new Response("Cannot delete default inbox", {
                        status: 400,
                    });
                return Response.json({ deleted: true });
            },
        },

        // ── SMTP Error-Simulation Rules ────────────────────────────────────────
        "/api/rules": {
            GET() {
                return Response.json(storage.getRules());
            },
            async POST(req) {
                const body = (await req.json()) as Omit<
                    import("../shared/types").SmtpRule,
                    "id"
                >;
                const rule = { ...body, id: randomUUID() };
                storage.addRule(rule);
                return Response.json(rule, { status: 201 });
            },
        },

        "/api/rules/:id": {
            DELETE(req) {
                storage.deleteRule(req.params.id);
                return Response.json({ deleted: true });
            },
        },

        // ── WebSocket upgrade ──────────────────────────────────────────────────
        "/ws"(req) {
            const success = server.upgrade(req);
            if (!success) {
                return new Response("WebSocket upgrade failed", {
                    status: 500,
                });
            }
        },
    },

    websocket: {
        open(ws) {
            wsClients.add(ws);
            console.log(`[WS] Client connected (total: ${wsClients.size})`);
            ws.send(JSON.stringify({ type: "connected" } satisfies WsMessage));
        },
        message(_ws, _message) {},
        close(ws) {
            wsClients.delete(ws);
            console.log(`[WS] Client disconnected (total: ${wsClients.size})`);
        },
    },

    development: {
        hmr: true,
        console: true,
    },
});

console.log(`[HTTP] Listening on http://localhost:${server.port}`);
