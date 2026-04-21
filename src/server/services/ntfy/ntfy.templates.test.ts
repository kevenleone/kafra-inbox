import { describe, expect, it } from "bun:test";

import type { Email } from "../../../shared/types";
import { buildDev, buildFull, buildShort } from "./ntfy.templates";

const baseEmail: Email = {
    attachments: [],
    bcc: [],
    cc: [],
    from: "Alice <alice@example.com>",
    headers: {},
    html: "<p>Hello</p>",
    id: "email-001",
    inboxId: "default",
    isRead: false,
    raw: "",
    size: 1024,
    subject: "Test subject",
    text: "Hello, this is the body.",
    timestamp: "2025-01-15T12:00:00.000Z",
    to: ["bob@example.com"],
};

describe("buildShort", () => {
    it("includes sender, first recipient, and inbox name", () => {
        const result = buildShort(baseEmail, "My Inbox");
        expect(result).toBe("Alice <alice@example.com> → bob@example.com [My Inbox]");
    });

    it("omits the arrow when there are no recipients", () => {
        const result = buildShort({ ...baseEmail, to: [] }, "My Inbox");
        expect(result).toBe("Alice <alice@example.com> [My Inbox]");
    });
});

describe("buildFull", () => {
    it("includes From, To, Inbox, and Size", () => {
        const result = buildFull(baseEmail, "My Inbox");
        expect(result).toContain("From: Alice <alice@example.com>");
        expect(result).toContain("To: bob@example.com");
        expect(result).toContain("Inbox: My Inbox");
        expect(result).toContain("Size: 1.0 KB");
    });

    it("includes text preview", () => {
        expect(buildFull(baseEmail, "My Inbox")).toContain("Hello, this is the body.");
    });

    it("omits CC line when CC is empty", () => {
        expect(buildFull(baseEmail, "My Inbox")).not.toContain("CC:");
    });

    it("includes CC when present", () => {
        const result = buildFull({ ...baseEmail, cc: ["carol@example.com"] }, "My Inbox");
        expect(result).toContain("CC: carol@example.com");
    });

    it("includes attachment summary", () => {
        const email = {
            ...baseEmail,
            attachments: [
                { cid: undefined, content: "", contentType: "image/png", filename: "photo.png", size: 2048 },
                { cid: undefined, content: "", contentType: "application/pdf", filename: "doc.pdf", size: 512 },
            ],
        };
        const result = buildFull(email, "My Inbox");
        expect(result).toContain("📎 2 attachments: photo.png, doc.pdf");
    });

    it("omits preview when text is absent", () => {
        const result = buildFull({ ...baseEmail, text: undefined }, "My Inbox");
        expect(result).not.toContain("Hello");
    });

    it("truncates long text preview to 500 chars and appends ellipsis", () => {
        const longText = "x".repeat(600);
        const result = buildFull({ ...baseEmail, text: longText }, "My Inbox");
        expect(result).toContain("x".repeat(500) + "…");
        expect(result).not.toContain("x".repeat(501));
    });
});

describe("buildDev", () => {
    it("includes email ID", () => {
        expect(buildDev(baseEmail, "My Inbox")).toContain("`email-001`");
    });

    it("includes BCC when present", () => {
        const result = buildDev({ ...baseEmail, bcc: ["hidden@example.com"] }, "My Inbox");
        expect(result).toContain("BCC: hidden@example.com");
    });

    it("omits BCC line when BCC is empty", () => {
        expect(buildDev(baseEmail, "My Inbox")).not.toContain("BCC:");
    });

    it("includes per-attachment size and content-type", () => {
        const email = {
            ...baseEmail,
            attachments: [
                { cid: undefined, content: "", contentType: "application/pdf", filename: "doc.pdf", size: 2048 },
            ],
        };
        const result = buildDev(email, "My Inbox");
        expect(result).toContain("📎 doc.pdf (application/pdf, 2.0 KB)");
    });

    it("wraps text preview in a blockquote", () => {
        const result = buildDev(baseEmail, "My Inbox");
        expect(result).toContain("> Hello, this is the body.");
    });
});
