import { formatSize } from "../../../client/utils/format";
import type { Email } from "../../../shared/types";

const TEXT_PREVIEW_LENGTH = 500;

function textPreview(email: Email): string | undefined {
    const raw = email.text?.trim().replace(/\s+/g, " ");
    
    if (!raw) {
        return undefined
    };

    return raw.length > TEXT_PREVIEW_LENGTH ? `${raw.slice(0, TEXT_PREVIEW_LENGTH)}…` : raw;
}

export function buildDev(email: Email, inboxName: string): string {
    const lines: string[] = [
        `From: ${email.from}`,
    ];

    if (email.to.length > 0)  {
        lines.push(`To: ${email.to.join(", ")}`)
    }

    if (email.cc.length > 0) {
        lines.push(`CC: ${email.cc.join(", ")}`)
    }

    if (email.bcc.length > 0) {
        lines.push(`BCC: ${email.bcc.join(", ")}`)
    }

    lines.push(`Inbox: ${inboxName}`);
    lines.push(`ID: \`${email.id}\``);
    lines.push(`Size: ${formatSize(email.size)}`);

    const preview = textPreview(email);
    if (preview) lines.push("", `> ${preview.replace(/\n/g, "\n> ")}`);

    if (email.attachments.length > 0) {
        lines.push("");

        for (const att of email.attachments) {
            lines.push(`📎 ${att.filename} (${att.contentType}, ${formatSize(att.size)})`);
        }
    }

    return lines.join("\n");
}

export function buildFull(email: Email, inboxName: string): string {
    const lines: string[] = [
        `From: ${email.from}`,
    ];


    if (email.to.length > 0) lines.push(`To: ${email.to.join(", ")}`);
    if (email.cc.length > 0) lines.push(`CC: ${email.cc.join(", ")}`);

    lines.push(`Inbox: ${inboxName}`);
    lines.push(`Size: ${formatSize(email.size)}`);

    const preview = textPreview(email);
    if (preview) lines.push("", preview);

    if (email.attachments.length > 0) {
        const names = email.attachments.map((a) => a.filename).join(", ");
        lines.push("", `📎 ${email.attachments.length} attachment${email.attachments.length !== 1 ? "s" : ""}: ${names}`);
    }

    return lines.join("\n");
}

export function buildShort(email: Email, inboxName: string): string {
    const to = email.to[0] ?? "";
    return `${email.from}${to ? ` → ${to}` : ""} [${inboxName}]`;
}