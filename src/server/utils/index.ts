import type { Email, Inbox, SmtpRule } from "../../shared/types";
import type { EmailRow, InboxRow, RuleRow } from "../types";

export function rowToEmail(row: EmailRow): Email {
    return {
        id: row.id,
        from: row.from_addr,
        to: JSON.parse(row.to_addrs),
        cc: JSON.parse(row.cc),
        bcc: JSON.parse(row.bcc),
        subject: row.subject,
        text: row.text ?? undefined,
        html: row.html ?? undefined,
        raw: row.raw,
        headers: JSON.parse(row.headers),
        attachments: JSON.parse(row.attachments),
        size: row.size,
        timestamp: row.timestamp,
        inboxId: row.inbox_id,
        isRead: row.is_read === 1,
    };
}

export function rowToInbox(row: InboxRow): Inbox {
    return {
        id: row.id,
        name: row.name,
        emailCount: row.email_count,
        unreadCount: row.unread_count,
        createdAt: row.created_at,
        smtp: JSON.parse(row.smtp),
    };
}

export function rowToRule(row: RuleRow): SmtpRule {
    return {
        id: row.id,
        type: row.type as SmtpRule["type"],
        pattern: row.pattern,
        errorCode: row.error_code ?? undefined,
        delayMs: row.delay_ms ?? undefined,
        description: row.description ?? undefined,
    };
}
