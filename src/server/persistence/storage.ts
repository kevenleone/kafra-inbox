import { Database } from "bun:sqlite";

import type { Email, Inbox, SmtpConfig, SmtpRule } from "../../shared/types";
import type { EmailRow, InboxRow, IStorage, RuleRow } from "../types";
import { rowToEmail, rowToInbox, rowToRule } from "../utils";

class SQLiteStorage implements IStorage {
    private db: Database;

    constructor(path = "./database/mail4all.db") {
        this.db = new Database(path, { create: true });

        this.db.run("PRAGMA journal_mode = WAL;");
        this.db.run("PRAGMA foreign_keys = ON;");

        this.migrate();
    }

    private migrate(): void {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS inboxes (
                id           TEXT PRIMARY KEY,
                created_at   TEXT NOT NULL,
                email_count  INTEGER NOT NULL DEFAULT 0,
                name         TEXT NOT NULL,
                smtp         TEXT NOT NULL
                unread_count INTEGER NOT NULL DEFAULT 0,
            );

            CREATE TABLE IF NOT EXISTS emails (
                id          TEXT PRIMARY KEY,
                attachments TEXT NOT NULL DEFAULT '[]',
                bcc         TEXT NOT NULL DEFAULT '[]',
                cc          TEXT NOT NULL DEFAULT '[]',
                from_addr   TEXT NOT NULL,
                headers     TEXT NOT NULL DEFAULT '{}',
                html        TEXT,
                inbox_id    TEXT NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
                is_read     INTEGER NOT NULL DEFAULT 0
                raw         TEXT NOT NULL DEFAULT '',
                size        INTEGER NOT NULL DEFAULT 0,
                subject     TEXT NOT NULL DEFAULT '',
                text        TEXT,
                timestamp   TEXT NOT NULL,
                to_addrs    TEXT NOT NULL,
            );

            CREATE INDEX IF NOT EXISTS idx_emails_inbox_id  ON emails(inbox_id);
            CREATE INDEX IF NOT EXISTS idx_emails_timestamp ON emails(timestamp DESC);

            CREATE TABLE IF NOT EXISTS rules (
                id          TEXT PRIMARY KEY,
                delay_ms    INTEGER,
                description TEXT
                error_code  INTEGER,
                pattern     TEXT NOT NULL,
                type        TEXT NOT NULL,
            );
        `);

        // Seed the default inbox if it doesn't exist yet
        const exists = this.db
            .query("SELECT 1 FROM inboxes WHERE id = 'default'")
            .get();

        if (!exists) {
            this.db
                .query(
                    `INSERT INTO inboxes (id, name, email_count, unread_count, created_at, smtp)
                     VALUES ('default', 'Default Inbox', 0, 0, ?, ?)`,
                )
                .run(new Date().toISOString(), JSON.stringify({ port: 1025 }));
        }
    }

    // ── Emails ────────────────────────────────────────────────────────────────

    addEmail(email: Email): void {
        this.db
            .query(
                `INSERT INTO emails
                    (id, from_addr, to_addrs, cc, bcc, subject, text, html, raw,
                     headers, attachments, size, timestamp, inbox_id, is_read)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
            )
            .run(
                email.id,
                email.from,
                JSON.stringify(email.to),
                JSON.stringify(email.cc),
                JSON.stringify(email.bcc),
                email.subject,
                email.text ?? null,
                email.html ?? null,
                email.raw,
                JSON.stringify(email.headers),
                JSON.stringify(email.attachments),
                email.size,
                email.timestamp,
                email.inboxId,
            );

        this.db
            .query(
                `UPDATE inboxes
                 SET email_count  = email_count  + 1,
                     unread_count = unread_count + 1
                 WHERE id = ?`,
            )
            .run(email.inboxId);
    }

    getEmails(
        page = 1,
        pageSize = 20,
        inboxId?: string,
        search?: string,
    ): { data: Email[]; total: number } {
        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (inboxId) {
            conditions.push("inbox_id = ?");
            params.push(inboxId);
        }

        if (search) {
            const q = `%${search}%`;
            conditions.push(
                "(subject LIKE ? OR from_addr LIKE ? OR to_addrs LIKE ? OR text LIKE ?)",
            );
            params.push(q, q, q, q);
        }

        const where =
            conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const { total } = this.db
            .query<
                { total: number },
                (string | number)[]
            >(`SELECT COUNT(*) AS total FROM emails ${where}`)
            .get(...params)!;

        const offset = (page - 1) * pageSize;
        const rows = this.db
            .query<EmailRow, (string | number)[]>(
                `SELECT * FROM emails ${where}
                 ORDER BY timestamp DESC
                 LIMIT ? OFFSET ?`,
            )
            .all(...params, pageSize, offset);

        return { data: rows.map(rowToEmail), total };
    }

    getEmail(id: string): Email | undefined {
        const row = this.db
            .query<EmailRow, string>("SELECT * FROM emails WHERE id = ?")
            .get(id);
        return row ? rowToEmail(row) : undefined;
    }

    deleteEmail(id: string): boolean {
        const email = this.getEmail(id);
        if (!email) return false;

        this.db.query("DELETE FROM emails WHERE id = ?").run(id);

        this.db
            .query(
                `UPDATE inboxes
                 SET email_count  = MAX(0, email_count  - 1),
                     unread_count = MAX(0, unread_count - ?)
                 WHERE id = ?`,
            )
            .run(email.isRead ? 0 : 1, email.inboxId);

        return true;
    }

    clearInbox(inboxId = "default"): number {
        const { count } = this.db
            .query<
                { count: number },
                string
            >("SELECT COUNT(*) AS count FROM emails WHERE inbox_id = ?")
            .get(inboxId)!;

        this.db.query("DELETE FROM emails WHERE inbox_id = ?").run(inboxId);

        this.db
            .query(
                "UPDATE inboxes SET email_count = 0, unread_count = 0 WHERE id = ?",
            )
            .run(inboxId);

        return count;
    }

    markAsRead(id: string): void {
        const email = this.getEmail(id);
        if (!email || email.isRead) return;

        this.db.query("UPDATE emails SET is_read = 1 WHERE id = ?").run(id);

        this.db
            .query(
                "UPDATE inboxes SET unread_count = MAX(0, unread_count - 1) WHERE id = ?",
            )
            .run(email.inboxId);
    }

    // ── Inboxes ───────────────────────────────────────────────────────────────

    getInboxes(): Inbox[] {
        return this.db
            .query<InboxRow, []>("SELECT * FROM inboxes")
            .all()
            .map(rowToInbox);
    }

    getInbox(id: string): Inbox | undefined {
        const row = this.db
            .query<InboxRow, string>("SELECT * FROM inboxes WHERE id = ?")
            .get(id);
        return row ? rowToInbox(row) : undefined;
    }

    getInboxByUsername(username: string): Inbox | undefined {
        // smtp column is JSON; use json_extract for indexed lookup
        const row = this.db
            .query<
                InboxRow,
                string
            >("SELECT * FROM inboxes WHERE json_extract(smtp, '$.username') = ?")
            .get(username);
        return row ? rowToInbox(row) : undefined;
    }

    addInbox(inbox: Inbox): void {
        this.db
            .query(
                `INSERT INTO inboxes (id, name, email_count, unread_count, created_at, smtp)
                 VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(
                inbox.id,
                inbox.name,
                inbox.emailCount,
                inbox.unreadCount,
                inbox.createdAt,
                JSON.stringify(inbox.smtp),
            );
    }

    updateInboxSmtp(id: string, smtp: SmtpConfig): Inbox | undefined {
        const rows = this.db
            .query<
                InboxRow,
                [string, string]
            >("UPDATE inboxes SET smtp = ? WHERE id = ? RETURNING *")
            .all(JSON.stringify(smtp), id);

        return rows.length > 0 ? rowToInbox(rows[0]!) : undefined;
    }

    deleteInbox(id: string): boolean {
        if (id === "default") return false;
        const rows = this.db
            .query<
                InboxRow,
                string
            >("DELETE FROM inboxes WHERE id = ? RETURNING id")
            .all(id);
        return rows.length > 0;
    }

    // ── Rules ─────────────────────────────────────────────────────────────────

    getRules(): SmtpRule[] {
        return this.db
            .query<RuleRow, []>("SELECT * FROM rules")
            .all()
            .map(rowToRule);
    }

    addRule(rule: SmtpRule): void {
        this.db
            .query(
                `INSERT INTO rules (id, type, pattern, error_code, delay_ms, description)
                 VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(
                rule.id,
                rule.type,
                rule.pattern,
                rule.errorCode ?? null,
                rule.delayMs ?? null,
                rule.description ?? null,
            );
    }

    deleteRule(id: string): void {
        this.db.query("DELETE FROM rules WHERE id = ?").run(id);
    }
}

export const storage: IStorage = new SQLiteStorage();
