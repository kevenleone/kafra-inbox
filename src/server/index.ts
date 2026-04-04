import pkg from "../../package.json";
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
import { environment } from "./utils/environment";

const HTTP_PORT = environment.KAFRAINBOX_HTTP_PORT;
const SMTP_PORT = environment.KAFRAINBOX_SMTP_PORT;

const wsClients = new Set<{ send: (message: string) => void }>();

function broadcast(message: WsMessage) {
    const payload = JSON.stringify(message);

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

console.log(`
 _          __            _____       _               
| | ____ _ / _|_ __ __ _  \\_   \\_ __ | |__   _____  __
| |/ / _\` | |_| '__/ _\` |  / /\\/ '_ \\| '_ \\ / _ \\ \\/ /
|   < (_| |  _| | | (_| /\\/ /_ | | | | |_) | (_) >  < 
|_|\\_\\__,_|_| |_|  \\__,_\\____/ |_| |_|_.__/ \\___/_/\\_\\
`);

console.log("[SERVER] Kafra Inbox", pkg.version);
console.log(`[HTTP] Listening on http://localhost:${server.port}`);

startSmtpServer(broadcast).catch(() =>
    console.error(`[SMTP] Could not bind to port ${SMTP_PORT}`),
);
