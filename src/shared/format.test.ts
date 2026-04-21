import { afterEach, describe, expect, it, setSystemTime } from "bun:test";

import { formatSize, formatTime } from "./format";

describe("formatSize", () => {
    it("formats bytes below 1 KB", () => {
        expect(formatSize(0)).toBe("0 B");
        expect(formatSize(500)).toBe("500 B");
        expect(formatSize(1023)).toBe("1023 B");
    });

    it("formats kilobytes", () => {
        expect(formatSize(1024)).toBe("1.0 KB");
        expect(formatSize(1536)).toBe("1.5 KB");
        expect(formatSize(1024 * 1024 - 1)).toBe("1024.0 KB");
    });

    it("formats megabytes", () => {
        expect(formatSize(1024 * 1024)).toBe("1.0 MB");
        expect(formatSize(2.5 * 1024 * 1024)).toBe("2.5 MB");
    });
});

describe("formatTime", () => {
    const NOW = new Date("2025-06-15T12:00:00.000Z");

    afterEach(() => setSystemTime());

    it("returns 'just now' for timestamps less than 60 seconds ago", () => {
        setSystemTime(NOW);
        expect(formatTime(new Date(NOW.getTime() - 30_000).toISOString())).toBe("just now");
        expect(formatTime(new Date(NOW.getTime() - 59_000).toISOString())).toBe("just now");
    });

    it("returns minutes ago for timestamps less than 1 hour ago", () => {
        setSystemTime(NOW);
        expect(formatTime(new Date(NOW.getTime() - 5 * 60_000).toISOString())).toBe("5m ago");
        expect(formatTime(new Date(NOW.getTime() - 59 * 60_000).toISOString())).toBe("59m ago");
    });

    it("returns a non-relative string for timestamps older than 1 hour", () => {
        setSystemTime(NOW);
        const result = formatTime(new Date(NOW.getTime() - 2 * 3_600_000).toISOString());
        expect(result).not.toMatch(/ago/);
        expect(result).not.toBe("just now");
    });

    it("returns a date string for timestamps older than 24 hours", () => {
        setSystemTime(NOW);
        const result = formatTime(new Date(NOW.getTime() - 48 * 3_600_000).toISOString());
        expect(result).not.toMatch(/ago/);
        expect(result).not.toBe("just now");
    });
});
