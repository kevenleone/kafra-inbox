import type { Email, Inbox, SmtpRule } from "../../shared/types";
import type { EmailRow, InboxRow, RuleRow } from "../types";

export function rowToEmail(row: EmailRow): Email {
    return {
        attachments: JSON.parse(row.attachments),
        bcc: JSON.parse(row.bcc),
        cc: JSON.parse(row.cc),
        from: row.from_addr,
        headers: JSON.parse(row.headers),
        html: row.html ?? undefined,
        id: row.id,
        inboxId: row.inbox_id,
        isRead: row.is_read === 1,
        raw: row.raw,
        size: row.size,
        subject: row.subject,
        text: row.text ?? undefined,
        timestamp: row.timestamp,
        to: JSON.parse(row.to_addrs),
    };
}

export function rowToInbox(row: InboxRow): Inbox {
    return {
        createdAt: row.created_at,
        emailCount: row.email_count,
        id: row.id,
        name: row.name,
        smtp: JSON.parse(row.smtp),
        unreadCount: row.unread_count,
    };
}

export function rowToRule(row: RuleRow): SmtpRule {
    return {
        delayMs: row.delay_ms ?? undefined,
        description: row.description ?? undefined,
        errorCode: row.error_code ?? undefined,
        id: row.id,
        pattern: row.pattern,
        type: row.type as SmtpRule["type"],
    };
}
