/**
 * Quick test: send an email via SMTP to verify the sandbox captures it.
 * Run: bun test-email.ts
 */
import * as net from "node:net";

function sendSmtpEmail(opts: {
    host: string;
    port: number;
    from: string;
    to: string;
    subject: string;
    html: string;
}): Promise<void> {
    return new Promise((resolve, reject) => {
        const socket = net.createConnection(opts.port, opts.host);

        const body = [
            `From: Test Sender <${opts.from}>`,
            `To: Test Inbox <${opts.to}>`,
            `Subject: ${opts.subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=UTF-8`,
            ``,
            opts.html,
            `.`,
            `QUIT`,
        ].join("\r\n");

        const lines: string[] = [
            `EHLO test.local`,
            `MAIL FROM:<${opts.from}>`,
            `RCPT TO:<${opts.to}>`,
            `DATA`,
        ];

        let step = 0;

        socket.on("data", (data) => {
            const resp = data.toString();
            process.stdout.write(resp);

            if (resp.startsWith("4") || resp.startsWith("5")) {
                socket.destroy();
                return reject(new Error(`SMTP error: ${resp.trim()}`));
            }

            if (step < lines.length) {
                const cmd = lines[step++]!;
                socket.write(cmd + "\r\n");
                if (cmd === "DATA") {
                    // After server says "354 Start…", send body
                    return;
                }
            } else if (resp.startsWith("354")) {
                socket.write(body + "\r\n");
            } else if (resp.startsWith("250 ") && step >= lines.length) {
                // Message accepted
            } else if (resp.startsWith("221")) {
                socket.end();
                resolve();
            }
        });

        socket.on("error", reject);
    });
}

await sendSmtpEmail({
    from: "sender@example.com",
    host: "localhost",
    port: 1025,
    subject: "Hello from KafraInbox!",
    to: "inbox@myapp.com",
    html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #1e40af;">Welcome to KafraInbox 🎉</h1>
      <p>This is a <strong>test email</strong> captured by your local SMTP sandbox.</p>
      <p>You can view HTML, text, raw MIME, headers, and attachments in the web UI.</p>
      <a href="http://localhost:3000" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 12px;">
        Open KafraInbox
      </a>
    </div>
  `,
});

console.log("\n✓ Email sent successfully. Check http://localhost:3000");
