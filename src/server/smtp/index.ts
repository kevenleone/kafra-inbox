import type { SMTPServer } from "smtp-server";
import type { Email, WsMessage } from "../../shared/types";
import { environment } from "../utils/environment";
import { createSMTPServer } from "./smtp-server";

const SMTP_PORT = environment.KAFRAINBOX_SMTP_PORT;

declare global {
    var __smtpServer: InstanceType<typeof SMTPServer> | null;
}

globalThis.__smtpServer ??= null;

export function startSmtpServer(
    broadcast: (msg: WsMessage) => void,
): Promise<InstanceType<typeof SMTPServer>> {
    return new Promise((resolve, reject) => {
        if (globalThis.__smtpServer) {
            console.log(`[SMTP] Listening on port ${SMTP_PORT}`);

            return resolve(globalThis.__smtpServer);
        }

        const server = createSMTPServer((email: Email) => {
            broadcast({ type: "new_email", email });
        });

        server.listen(SMTP_PORT, (error?: Error) => {
            if (error) {
                console.error(
                    `[SMTP] Failed to start on port ${SMTP_PORT}:`,
                    error,
                );

                return reject(error);
            }

            console.log(`[SMTP] Listening on port ${SMTP_PORT}`);

            globalThis.__smtpServer = server;

            resolve(server);
        });
    });
}
