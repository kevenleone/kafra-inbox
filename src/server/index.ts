import index from "../client/index.html";
import type { WsMessage } from "../shared/types";
import {
    emailAttachmentHandler,
    emailByIdHandler,
    emailRawHandler,
    emailsHandler,
} from "./http/emails";
import { inboxByIdHandler, inboxesHandler } from "./http/inboxes";
import { ruleByIdHandler, rulesHandler } from "./http/rules";
import { startSmtpServer } from "./smtp";

const HTTP_PORT = 3000;
const SMTP_PORT = 1025;

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

const httpHandler = {
    broadcast,
};

const server = Bun.serve({
    development: {
        hmr: true,
        console: true,
    },

    port: HTTP_PORT,

    routes: {
        "/": index,
        "/api/emails": emailsHandler(httpHandler),
        "/api/emails/:id": emailByIdHandler(httpHandler),
        "/api/emails/:id/raw": emailRawHandler,
        "/api/emails/:id/attachments/:index": emailAttachmentHandler,
        "/api/inboxes": inboxesHandler,
        "/api/inboxes/:id": inboxByIdHandler(httpHandler),
        "/api/rules": rulesHandler,
        "/api/rules/:id": ruleByIdHandler,
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
});

startSmtpServer(broadcast).catch(() =>
    console.error(`[SMTP] Could not bind to port ${SMTP_PORT}`),
);

console.log(`[HTTP] Listening on http://localhost:${server.port}`);
