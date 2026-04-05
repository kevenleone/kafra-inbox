import type {
    Email,
    Inbox,
    SmtpConfig,
    SmtpRule,
    WsMessage,
} from "../shared/types";

export interface User {
    username: string;
    passwordHash: string;
    createdAt: string;
}

export interface UserRow {
    username: string;
    password_hash: string;
    created_at: string;
}

export interface EmailRow {
    attachments: string;
    bcc: string;
    cc: string;
    from_addr: string;
    headers: string;
    html: string | null;
    id: string;
    inbox_id: string;
    is_read: number;
    raw: string;
    size: number;
    subject: string;
    text: string | null;
    timestamp: string;
    to_addrs: string;
}

export interface IStorage {
    addEmail(email: Email): void;
    addInbox(inbox: Inbox): void;
    addRule(rule: SmtpRule): void;
    clearInbox(inboxId: string): number;
    createSession(token: string, username: string): void;
    createUser(username: string, passwordHash: string): void;
    deleteEmail(id: string): boolean;
    deleteSession(token: string): void;
    deleteInbox(id: string): boolean;
    deleteRule(id: string): void;
    getEmail(id: string): Email | undefined;
    getEmails(
        page: number,
        pageSize: number,
        inboxId?: string,
        search?: string,
    ): { data: Email[]; total: number };
    getInbox(id: string): Inbox | undefined;
    getInboxByUsername(username: string): Inbox | undefined;
    getInboxes(): Inbox[];
    getRules(): SmtpRule[];
    getSession(token: string): { username: string } | undefined;
    getUserByUsername(username: string): User | undefined;
    hasUsers(): boolean;
    markAsRead(id: string): void;
    updateInboxSmtp(id: string, smtp: SmtpConfig): Inbox | undefined;
}

export interface InboxRow {
    created_at: string;
    email_count: number;
    id: string;
    name: string;
    smtp: string;
    unread_count: number;
}

export interface RuleRow {
    delay_ms: number | null;
    description: string | null;
    error_code: number | null;
    id: string;
    pattern: string;
    type: string;
}

export type HTTPHandler = {
    broadcast: (message: WsMessage) => void;
};
