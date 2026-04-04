import type { SMTPServer } from "smtp-server";
import type { Email, WsMessage } from "../../shared/types";
import { environment } from "../utils/environment";
import { createSMTPServer } from "./smtp-server";

const SMTP_PORT = environment.KAFRAINBOX_SMTP_PORT;

let smtpServer: InstanceType<typeof SMTPServer> | null = null;

export function startSmtpServer(
    broadcast: (msg: WsMessage) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (smtpServer) {
            return resolve();
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

            smtpServer = server;

            resolve();
        });
    });
}
