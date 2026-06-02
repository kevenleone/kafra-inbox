import pkg from "../../package.json";
import index from "../client/index.html";
import type { WsMessage } from "../shared/types";
import {
    authLoginHandler,
    authLogoutHandler,
    authSetupHandler,
    authStatusHandler,
    getSession,
    withAuth,
} from "./http/auth";
import { configHandler } from "./http/config";
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

const HTTP_PORT = environment.KAFRAINBOX_HTTP_SERVER_PORT;
const SMTP_PORT = environment.KAFRAINBOX_SMTP_SERVER_PORT;

const sseClients = new Set<ReadableStreamDefaultController<string>>();

function broadcast(message: WsMessage) {
    const data = `data: ${JSON.stringify(message)}\n\n`;

    for (const ctrl of sseClients) {
        try {
            ctrl.enqueue(data);
        } catch {
            sseClients.delete(ctrl);
        }
    }
}

function sseHandler(req: Request): Response {
    if (!environment.KAFRAINBOX_DANGEROUSLY_NO_AUTH && !getSession(req)) {
        return new Response("Unauthorized", { status: 401 });
    }

    let controller: ReadableStreamDefaultController<string>;

    const stream = new ReadableStream<string>({
        start(ctrl) {
            controller = ctrl;
            sseClients.add(ctrl);
            console.log(`[SSE] Client connected (total: ${sseClients.size})`);
            ctrl.enqueue(
                `data: ${JSON.stringify({ type: "connected" } satisfies WsMessage)}\n\n`,
            );
        },
        cancel() {
            sseClients.delete(controller);
            console.log(
                `[SSE] Client disconnected (total: ${sseClients.size})`,
            );
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
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
        "/*": index,
        "/api/config": withAuth(configHandler),
        "/api/auth/login": authLoginHandler,
        "/api/auth/logout": authLogoutHandler,
        "/api/auth/setup": authSetupHandler,
        "/api/auth/status": authStatusHandler,
        "/api/emails": withAuth(emailsHandler(httpHandler)),
        "/api/emails/:id": withAuth(emailByIdHandler(httpHandler)),
        "/api/emails/:id/raw": withAuth(emailRawHandler),
        "/api/emails/:id/attachments/:index": withAuth(emailAttachmentHandler),
        "/api/inboxes": withAuth(inboxesHandler),
        "/api/inboxes/:id": withAuth(inboxByIdHandler(httpHandler)),
        "/api/rules": withAuth(rulesHandler),
        "/api/rules/:id": withAuth(ruleByIdHandler),
        "/sse": sseHandler,
    },
});

console.log(Bun.color("#d4ff00", "ansi"));
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
