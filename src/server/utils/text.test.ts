import { describe, expect, it } from "bun:test";

import { generatePass, generateText } from "./text";

describe("generateText", () => {
    it("slugifies a simple name", () => {
        expect(generateText("My Project")).toMatch(/^my-project-[0-9a-f]{6}$/);
    });

    it("collapses consecutive special characters into a single hyphen", () => {
        expect(generateText("Hello & World!")).toMatch(/^hello-world-[0-9a-f]{6}$/);
    });

    it("strips leading and trailing hyphens", () => {
        expect(generateText("---hello---")).toMatch(/^hello-[0-9a-f]{6}$/);
    });

    it("truncates the base to 24 characters", () => {
        const result = generateText("a".repeat(40));
        const base = result.slice(0, result.lastIndexOf("-"));
        expect(base.length).toBeLessThanOrEqual(24);
    });

    it("falls back to 'inbox' for special-char-only input", () => {
        expect(generateText("!!!")).toMatch(/^inbox-[0-9a-f]{6}$/);
    });

    it("falls back to 'inbox' for empty string", () => {
        expect(generateText("")).toMatch(/^inbox-[0-9a-f]{6}$/);
    });

    it("produces a unique suffix on each call", () => {
        expect(generateText("test")).not.toBe(generateText("test"));
    });
});

describe("generatePass", () => {
    it("defaults to 16 hex chars (8 bytes)", () => {
        expect(generatePass()).toMatch(/^[0-9a-f]{16}$/);
    });

    it("respects a custom byte count", () => {
        expect(generatePass(4)).toMatch(/^[0-9a-f]{8}$/);
        expect(generatePass(16)).toMatch(/^[0-9a-f]{32}$/);
    });

    it("produces a unique value on each call", () => {
        expect(generatePass()).not.toBe(generatePass());
    });
});
