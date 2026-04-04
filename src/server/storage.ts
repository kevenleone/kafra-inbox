import type { Email, Inbox, SmtpConfig, SmtpRule } from "../shared/types";

export interface IStorage {
    addEmail(email: Email): void;
    getEmails(
        page: number,
        pageSize: number,
        inboxId?: string,
        search?: string,
    ): { data: Email[]; total: number };
    getEmail(id: string): Email | undefined;
    deleteEmail(id: string): boolean;
    clearInbox(inboxId: string): number;
    getInbox(id: string): Inbox | undefined;
    getInboxes(): Inbox[];
    getInboxByUsername(username: string): Inbox | undefined;
    addInbox(inbox: Inbox): void;
    updateInboxSmtp(id: string, smtp: SmtpConfig): Inbox | undefined;
    deleteInbox(id: string): boolean;
    markAsRead(id: string): void;
    getRules(): SmtpRule[];
    addRule(rule: SmtpRule): void;
    deleteRule(id: string): void;
}

class MemoryStorage implements IStorage {
    private emails = new Map<string, Email>();
    private emailOrder: string[] = []; // newest first

    private inboxes = new Map<string, Inbox>([
        [
            "default",
            {
                id: "default",
                name: "Default Inbox",
                emailCount: 0,
                unreadCount: 0,
                createdAt: new Date().toISOString(),
                smtp: { port: 1025 },
            },
        ],
    ]);

    private rules: SmtpRule[] = [];

    addEmail(email: Email): void {
        this.emails.set(email.id, email);
        this.emailOrder.unshift(email.id); // newest first

        const inbox = this.inboxes.get(email.inboxId);

        if (inbox) {
            inbox.emailCount++;
            inbox.unreadCount++;
        }
    }

    getEmails(
        page = 1,
        pageSize = 20,
        inboxId?: string,
        search?: string,
    ): { data: Email[]; total: number } {
        let ids = [...this.emailOrder];

        if (inboxId) {
            ids = ids.filter((id) => this.emails.get(id)?.inboxId === inboxId);
        }

        if (search) {
            const q = search.toLowerCase();
            ids = ids.filter((id) => {
                const e = this.emails.get(id);

                if (!e) return false;
                return (
                    e.subject.toLowerCase().includes(q) ||
                    e.from.toLowerCase().includes(q) ||
                    e.to.some((t) => t.toLowerCase().includes(q)) ||
                    e.text?.toLowerCase().includes(q)
                );
            });
        }

        const total = ids.length;
        const start = (page - 1) * pageSize;
        const pageIds = ids.slice(start, start + pageSize);

        return {
            data: pageIds.map((id) => this.emails.get(id)!),
            total,
        };
    }

    getEmail(id: string): Email | undefined {
        return this.emails.get(id);
    }

    deleteEmail(id: string): boolean {
        const email = this.emails.get(id);
        if (!email) return false;

        this.emails.delete(id);
        this.emailOrder = this.emailOrder.filter((eid) => eid !== id);

        const inbox = this.inboxes.get(email.inboxId);
        if (inbox) {
            inbox.emailCount = Math.max(0, inbox.emailCount - 1);
            if (!email.isRead)
                inbox.unreadCount = Math.max(0, inbox.unreadCount - 1);
        }

        return true;
    }

    clearInbox(inboxId = "default"): number {
        const toDelete = this.emailOrder.filter(
            (id) => this.emails.get(id)?.inboxId === inboxId,
        );
        toDelete.forEach((id) => this.emails.delete(id));
        this.emailOrder = this.emailOrder.filter(
            (id) => !toDelete.includes(id),
        );

        const inbox = this.inboxes.get(inboxId);
        if (inbox) {
            inbox.emailCount = 0;
            inbox.unreadCount = 0;
        }

        return toDelete.length;
    }

    getInbox(id: string): Inbox | undefined {
        return this.inboxes.get(id);
    }

    getInboxes(): Inbox[] {
        return Array.from(this.inboxes.values());
    }

    getInboxByUsername(username: string): Inbox | undefined {
        return Array.from(this.inboxes.values()).find(
            (inbox) => inbox.smtp.username === username,
        );
    }

    addInbox(inbox: Inbox): void {
        this.inboxes.set(inbox.id, inbox);
    }

    updateInboxSmtp(id: string, smtp: SmtpConfig): Inbox | undefined {
        const inbox = this.inboxes.get(id);
        if (!inbox) return undefined;
        const updated = { ...inbox, smtp };
        this.inboxes.set(id, updated);
        return updated;
    }

    deleteInbox(id: string): boolean {
        if (id === "default") return false; // protect default inbox
        this.clearInbox(id);
        return this.inboxes.delete(id);
    }

    markAsRead(id: string): void {
        const email = this.emails.get(id);
        if (email && !email.isRead) {
            email.isRead = true;
            const inbox = this.inboxes.get(email.inboxId);
            if (inbox) inbox.unreadCount = Math.max(0, inbox.unreadCount - 1);
        }
    }

    getRules(): SmtpRule[] {
        return [...this.rules];
    }

    addRule(rule: SmtpRule): void {
        this.rules.push(rule);
    }

    deleteRule(id: string): void {
        this.rules = this.rules.filter((r) => r.id !== id);
    }
}

export const storage: IStorage = new MemoryStorage();
