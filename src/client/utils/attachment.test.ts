import { describe, expect, it } from "bun:test";

import type { Attachment } from "../../shared/types";
import { inlineAttachments } from "./attachment";

const png = (cid: string, content = "base64data"): Attachment => ({
    cid,
    content,
    contentType: "image/png",
    filename: `${cid}.png`,
    size: 100,
});

describe("inlineAttachments", () => {
    it("replaces a cid reference with a data URI", () => {
        const html = '<img src="cid:img001">';
        const result = inlineAttachments([png("img001", "abc123")], html);
        expect(result).toBe('<img src="data:image/png;base64,abc123">');
    });

    it("leaves unmatched cid references unchanged", () => {
        const html = '<img src="cid:unknown">';
        expect(inlineAttachments([png("img001")], html)).toBe(html);
    });

    it("handles html with no cid references", () => {
        const html = "<p>Hello world</p>";
        expect(inlineAttachments([png("img001")], html)).toBe(html);
    });

    it("replaces multiple cid references in a single pass", () => {
        const attachments = [png("cid1", "aaa"), png("cid2", "bbb")];
        const html = '<img src="cid:cid1"><img src="cid:cid2">';
        expect(inlineAttachments(attachments, html)).toBe(
            '<img src="data:image/png;base64,aaa"><img src="data:image/png;base64,bbb">',
        );
    });

    it("handles empty attachment list without modifying html", () => {
        const html = '<img src="cid:img001">';
        expect(inlineAttachments([], html)).toBe(html);
    });

    it("uses the correct content-type for each attachment", () => {
        const pdf: Attachment = {
            cid: "doc001",
            content: "pdfdata",
            contentType: "application/pdf",
            filename: "doc.pdf",
            size: 200,
        };
        const html = '<embed src="cid:doc001">';
        expect(inlineAttachments([pdf], html)).toBe(
            '<embed src="data:application/pdf;base64,pdfdata">',
        );
    });
});
