import { beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";

import type { Email, Inbox } from "../../shared/types";
import { SQLiteStorage } from "./storage";

function makeEmail(override?: Partial<Email>): Email {
    return {
        attachments: [],
        bcc: [],
        cc: [],
        from: "sender@example.com",
        headers: {},
        html: "<p>Hello</p>",
        id: randomUUID(),
        inboxId: "default",
        isRead: false,
        raw: "raw content",
        size: 500,
        subject: "Test Subject",
        text: "Hello world",
        timestamp: new Date().toISOString(),
        to: ["recipient@example.com"],
        ...override,
    };
}

function makeInbox(override?: Partial<Inbox>): Inbox {
    return {
        createdAt: new Date().toISOString(),
        emailCount: 0,
        id: randomUUID(),
        name: "Test Inbox",
        smtp: { password: "pass", port: 1025, username: "user" },
        unreadCount: 0,
        ...override,
    };
}

describe("SQLiteStorage", () => {
    let db: SQLiteStorage;

    beforeEach(() => {
        db = new SQLiteStorage(":memory:");
    });

    // ── Default inbox ─────────────────────────────────────────────────────────

    it("seeds a default inbox on first init", () => {
        const inbox = db.getInbox("default");
        expect(inbox).toBeDefined();
        expect(inbox!.name).toBe("Default Inbox");
    });

    // ── Emails ────────────────────────────────────────────────────────────────

    it("adds an email and retrieves it by id", () => {
        const email = makeEmail();
        db.addEmail(email);
        const retrieved = db.getEmail(email.id);
        expect(retrieved).toBeDefined();
        expect(retrieved!.subject).toBe("Test Subject");
        expect(retrieved!.isRead).toBe(false);
    });

    it("increments inbox email_count and unread_count on add", () => {
        db.addEmail(makeEmail());
        db.addEmail(makeEmail());
        const inbox = db.getInbox("default")!;
        expect(inbox.emailCount).toBe(2);
        expect(inbox.unreadCount).toBe(2);
    });

    it("marks an email as read and decrements unread_count", () => {
        const email = makeEmail();
        db.addEmail(email);
        db.markAsRead(email.id);
        expect(db.getEmail(email.id)!.isRead).toBe(true);
        expect(db.getInbox("default")!.unreadCount).toBe(0);
    });

    it("does not decrement unread_count when marking an already-read email", () => {
        const email = makeEmail();
        db.addEmail(email);
        db.markAsRead(email.id);
        db.markAsRead(email.id); // second call — should be a no-op
        expect(db.getInbox("default")!.unreadCount).toBe(0);
    });

    it("deletes an email and updates counters", () => {
        const email = makeEmail();
        db.addEmail(email);
        const deleted = db.deleteEmail(email.id);
        expect(deleted).toBe(true);
        expect(db.getEmail(email.id)).toBeUndefined();
        const inbox = db.getInbox("default")!;
        expect(inbox.emailCount).toBe(0);
        expect(inbox.unreadCount).toBe(0);
    });

    it("does not decrement unread_count when deleting a read email", () => {
        const email = makeEmail();
        db.addEmail(email);
        db.markAsRead(email.id);
        db.deleteEmail(email.id);
        expect(db.getInbox("default")!.unreadCount).toBe(0);
    });

    it("returns false when deleting a non-existent email", () => {
        expect(db.deleteEmail("ghost")).toBe(false);
    });

    it("clears all emails in an inbox and resets counters", () => {
        db.addEmail(makeEmail());
        db.addEmail(makeEmail());
        const count = db.clearInbox("default");
        expect(count).toBe(2);
        expect(db.getEmails(1, 20, "default").total).toBe(0);
        const inbox = db.getInbox("default")!;
        expect(inbox.emailCount).toBe(0);
        expect(inbox.unreadCount).toBe(0);
    });

    it("paginates emails correctly", () => {
        for (let i = 0; i < 5; i++) db.addEmail(makeEmail());
        const page1 = db.getEmails(1, 3, "default");
        const page2 = db.getEmails(2, 3, "default");
        expect(page1.data).toHaveLength(3);
        expect(page1.total).toBe(5);
        expect(page2.data).toHaveLength(2);
    });

    it("searches emails by subject", () => {
        db.addEmail(makeEmail({ subject: "Hello World", text: "greeting" }));
        db.addEmail(makeEmail({ subject: "Unrelated", text: "nothing here" }));
        const { data, total } = db.getEmails(1, 20, "default", "Hello");
        expect(total).toBe(1);
        expect(data[0]!.subject).toBe("Hello World");
    });

    // ── Inboxes ───────────────────────────────────────────────────────────────

    it("adds and retrieves an inbox", () => {
        const inbox = makeInbox({ id: "inbox-1", name: "Work" });
        db.addInbox(inbox);
        expect(db.getInbox("inbox-1")!.name).toBe("Work");
    });

    it("retrieves inbox by SMTP username", () => {
        const inbox = makeInbox({ id: "inbox-u", smtp: { password: "p", port: 1025, username: "myuser" } });
        db.addInbox(inbox);
        expect(db.getInboxByUsername("myuser")!.id).toBe("inbox-u");
    });

    it("returns undefined for unknown SMTP username", () => {
        expect(db.getInboxByUsername("nobody")).toBeUndefined();
    });

    it("updates the SMTP config of an inbox", () => {
        const inbox = makeInbox({ id: "inbox-s" });
        db.addInbox(inbox);
        const updated = db.updateInboxSmtp("inbox-s", { password: "new", port: 1025, username: "new-user" });
        expect(updated!.smtp.username).toBe("new-user");
    });

    it("deletes a non-default inbox", () => {
        const inbox = makeInbox({ id: "inbox-d" });
        db.addInbox(inbox);
        expect(db.deleteInbox("inbox-d")).toBe(true);
        expect(db.getInbox("inbox-d")).toBeUndefined();
    });

    it("refuses to delete the default inbox", () => {
        expect(db.deleteInbox("default")).toBe(false);
        expect(db.getInbox("default")).toBeDefined();
    });

    // ── Rules ─────────────────────────────────────────────────────────────────

    it("adds and retrieves rules", () => {
        db.addRule({ id: "r1", pattern: ".*@spam.com", type: "reject", errorCode: 550 });
        db.addRule({ id: "r2", delayMs: 2000, pattern: ".*", type: "delay" });
        const rules = db.getRules();
        expect(rules).toHaveLength(2);
        expect(rules[0]!.type).toBe("reject");
        expect(rules[1]!.delayMs).toBe(2000);
    });

    it("deletes a rule", () => {
        db.addRule({ id: "r1", pattern: ".*", type: "reject" });
        db.deleteRule("r1");
        expect(db.getRules()).toHaveLength(0);
    });
});
