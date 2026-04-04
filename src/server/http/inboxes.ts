import { randomBytes, randomUUID } from "node:crypto";
import type { BunRequest } from "bun";

import type { Inbox, SmtpConfig } from "../../shared/types";
import { storage } from "../persistence/storage";
import type { HTTPHandler } from "../types";

const SMTP_PORT = 1025;

export function generateInboxUsername(name: string): string {
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

export const inboxesHandler = {
    GET() {
        return Response.json(storage.getInboxes());
    },

    async POST(req: BunRequest) {
        const body = (await req.json()) as { name?: string };
        const name = body.name?.trim();
        if (!name) {
            return Response.json(
                { error: "Name is required" },
                { status: 400 },
            );
        }

        const inbox: Inbox = {
            createdAt: new Date().toISOString(),
            emailCount: 0,
            id: randomUUID(),
            name,
            smtp: {
                port: SMTP_PORT,
                username: generateInboxUsername(name),
                password: randomBytes(8).toString("hex"),
            },
            unreadCount: 0,
        };

        storage.addInbox(inbox);

        return Response.json(inbox, { status: 201 });
    },
};

export const inboxByIdHandler = (_handler: HTTPHandler) => ({
    async PATCH(req: BunRequest<"/api/inboxes/:id">) {
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

    async DELETE(req: BunRequest<"/api/inboxes/:id">) {
        const deleted = storage.deleteInbox(req.params.id);
        if (!deleted)
            return new Response("Cannot delete default inbox", {
                status: 400,
            });
        return Response.json({ deleted: true });
    },
});
