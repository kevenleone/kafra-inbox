import type { BunRequest } from "bun";

import { storage } from "../persistence/storage";
import type { HTTPHandler } from "../types";

export const emailsHandler = ({ broadcast }: HTTPHandler) => ({
    GET(req: BunRequest) {
        const url = new URL(req.url);

        const page = parseInt(url.searchParams.get("page") ?? "1");
        const pageSize = parseInt(url.searchParams.get("pageSize") ?? "20");
        const inboxId = url.searchParams.get("inboxId") ?? undefined;
        const search = url.searchParams.get("search") ?? undefined;

        const result = storage.getEmails(page, pageSize, inboxId, search);

        return Response.json({ ...result, page, pageSize });
    },

    async DELETE(req: BunRequest) {
        const url = new URL(req.url);
        const inboxId = url.searchParams.get("inboxId") ?? "default";
        const count = storage.clearInbox(inboxId);

        broadcast({ type: "inbox_cleared", inboxId });

        return Response.json({ deleted: count });
    },
});

export const emailByIdHandler = ({ broadcast }: HTTPHandler) => ({
    DELETE(req: BunRequest<"/api/emails/:id">) {
        const deleted = storage.deleteEmail(req.params.id);

        if (!deleted) return new Response("Not found", { status: 404 });

        broadcast({ type: "email_deleted", id: req.params.id });

        return Response.json({ deleted: true });
    },

    GET(req: BunRequest<"/api/emails/:id">) {
        const email = storage.getEmail(req.params.id);

        if (!email) return new Response("Not found", { status: 404 });

        storage.markAsRead(req.params.id);

        return Response.json(email);
    },
});

export const emailRawHandler = {
    GET(req: BunRequest<"/api/emails/:id/raw">) {
        const email = storage.getEmail(req.params.id);

        if (!email) return new Response("Not found", { status: 404 });

        return new Response(email.raw, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    },
};

export const emailAttachmentHandler = {
    GET(req: BunRequest<"/api/emails/:id/attachments/:index">) {
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
};
