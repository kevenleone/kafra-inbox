import { describe, expect, it } from "bun:test";

import { extractDisplayName, extractEmail, unquote } from "./text";

describe("extractDisplayName", () => {
    it("returns the display name when one is present", () => {
        expect(extractDisplayName("Jane Doe <jane@example.com>")).toBe("Jane Doe");
    });

    it("returns the email address when there is no display name", () => {
        expect(extractDisplayName("<jane@example.com>")).toBe("jane@example.com");
    });

    it("returns the raw string when there are no angle brackets", () => {
        expect(extractDisplayName("jane@example.com")).toBe("jane@example.com");
    });

    it("trims whitespace around the display name", () => {
        expect(extractDisplayName("  Jane Doe  <jane@example.com>")).toBe("Jane Doe");
    });
});

describe("extractEmail", () => {
    it("extracts the email address from angle brackets", () => {
        expect(extractEmail("Jane Doe <jane@example.com>")).toBe("jane@example.com");
    });

    it("returns the raw string when there are no angle brackets", () => {
        expect(extractEmail("jane@example.com")).toBe("jane@example.com");
    });
});

describe("unquote", () => {
    it("removes all double-quote characters", () => {
        expect(unquote('"Jane Doe"')).toBe("Jane Doe");
    });

    it("removes multiple double-quote characters", () => {
        expect(unquote('"Hello" "World"')).toBe("Hello World");
    });

    it("leaves strings without double quotes unchanged", () => {
        expect(unquote("Jane Doe")).toBe("Jane Doe");
    });

    it("returns an empty string unchanged", () => {
        expect(unquote("")).toBe("");
    });
});
