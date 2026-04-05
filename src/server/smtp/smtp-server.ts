/**
 * SMTP Server - captures outgoing test emails on a shared SMTP listener.
 * Inboxes are routed by SMTP auth username and password.
 */

import { simpleParser } from "mailparser";
import { randomUUID } from "node:crypto";
import { SMTPServer } from "smtp-server";

import type { Email } from "../../shared/types";
import { storage } from "../persistence/storage";
import { environment } from "../utils/environment";
import { extractAddresses } from "../utils/extract-addresses";

export function createSMTPServer(onEmail: (email: Email) => void) {
    const server = new SMTPServer({
        authOptional: environment.KAFRAINBOX_SMTP_SERVER_AUTH_OPTIONAL,
        disabledCommands: ["STARTTLS"],
        logger: environment.KAFRAINBOX_SMTP_SERVER_LOGGER,
        secure: environment.KAFRAINBOX_SMTP_SERVER_AUTH_SECURE,

        onAuth(auth, _session, callback) {
            if (!auth.username) {
                return callback(new Error("Invalid credentials"));
            }

            const inbox = storage.getInboxByUsername(auth.username);

            if (!inbox || inbox.smtp.password !== auth.password) {
                return callback(new Error("Invalid credentials"));
            }

            return callback(null, { user: inbox.id });
        },

        onConnect(session, callback) {
            console.log(`[SMTP] New connection from ${session.remoteAddress}`);

            callback();
        },

        onMailFrom(address, _session, callback) {
            console.log(`[SMTP] MAIL FROM: ${address.address}`);

            callback();
        },

        onRcptTo(address, _session, callback) {
            console.log(`[SMTP] RCPT TO: ${address.address}`);

            const rules = storage.getRules();
            const rejectRule = rules.find(
                (r) =>
                    r.type === "reject" &&
                    new RegExp(r.pattern, "i").test(address.address),
            );

            if (rejectRule) {
                const err = Object.assign(
                    new Error("Recipient rejected by rule"),
                    {
                        responseCode: rejectRule.errorCode ?? 550,
                    },
                );
                return callback(err);
            }

            callback();
        },

        onData(stream, session, callback) {
            const chunks: Buffer[] = [];

            stream.on("data", (chunk: Buffer) => chunks.push(chunk));

            stream.on("end", async () => {
                const rawBuffer = Buffer.concat(chunks);
                const rawEmail = rawBuffer.toString("utf-8");

                try {
                    const inboxId =
                        typeof session.user === "string"
                            ? session.user
                            : "default";

                    const inbox =
                        storage.getInbox(inboxId) ??
                        storage.getInbox("default");

                    if (!inbox) {
                        callback(new Error("Inbox not found"));

                        return;
                    }

                    const delayRule = storage
                        .getRules()
                        .find((r) => r.type === "delay");

                    if (delayRule?.delayMs) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, delayRule.delayMs),
                        );
                    }

                    const parsed = await simpleParser(rawBuffer);

                    const headers: Record<string, string> = {};

                    const stringify = (v: unknown): string => {
                        if (typeof v === "string") return v;

                        if (
                            typeof v === "object" &&
                            v !== null &&
                            "text" in v
                        ) {
                            return String((v as { text: unknown }).text);
                        }

                        return String(v);
                    };

                    for (const [key, value] of parsed.headers) {
                        headers[key] = Array.isArray(value)
                            ? value.map(stringify).join(", ")
                            : stringify(value);
                    }

                    const email: Email = {
                        bcc: extractAddresses(parsed.bcc),
                        cc: extractAddresses(parsed.cc),
                        from:
                            parsed.from?.text ??
                            (session.envelope.mailFrom
                                ? (
                                      session.envelope.mailFrom as {
                                          address: string;
                                      }
                                  ).address
                                : "unknown"),
                        id: randomUUID(),
                        inboxId: inbox.id,
                        isRead: false,
                        headers,
                        html:
                            typeof parsed.html === "string"
                                ? parsed.html
                                : undefined,
                        raw: rawEmail,
                        attachments: (parsed.attachments ?? []).map((att) => ({
                            filename: att.filename ?? "attachment",
                            contentType: att.contentType,
                            size: att.size,
                            content: att.content.toString("base64"),
                            cid: att.cid,
                        })),
                        text: parsed.text ?? undefined,
                        timestamp: new Date().toISOString(),
                        to:
                            extractAddresses(parsed.to).length > 0
                                ? extractAddresses(parsed.to)
                                : session.envelope.rcptTo.map((r) => r.address),

                        subject: parsed.subject ?? "(no subject)",
                        size: rawBuffer.length,
                    };

                    storage.addEmail(email);

                    onEmail(email);

                    console.log(
                        `[SMTP:${inbox.id}] Stored email ${email.id} — "${email.subject}" (${email.size} bytes)`,
                    );

                    callback();
                } catch (err) {
                    console.error("[SMTP] Failed to parse email:", err);

                    callback(err as Error);
                }
            });

            stream.on("error", (err) => {
                console.error("[SMTP] Stream error:", err);

                callback(err);
            });
        },
    });

    server.on("error", (error) => {
        console.error("[SMTP] Server error:", error);
    });

    return server;
}
