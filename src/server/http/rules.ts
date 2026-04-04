import { randomUUID } from "node:crypto";
import type { BunRequest } from "bun";

import type { SmtpRule } from "../../shared/types";
import { storage } from "../persistence/storage";

export const rulesHandler = {
    GET() {
        return Response.json(storage.getRules());
    },

    async POST(req: BunRequest) {
        const body = (await req.json()) as Omit<SmtpRule, "id">;
        const rule = { ...body, id: randomUUID() };
        storage.addRule(rule);
        return Response.json(rule, { status: 201 });
    },
};

export const ruleByIdHandler = {
    DELETE(req: BunRequest<"/api/rules/:id">) {
        storage.deleteRule(req.params.id);
        return Response.json({ deleted: true });
    },
};
