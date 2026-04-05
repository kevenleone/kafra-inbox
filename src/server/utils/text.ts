import { randomBytes } from "node:crypto";

export function generateText(name: string): string {
    const base =
        name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 24) || "inbox";

    return `${base}-${randomBytes(3).toString("hex")}`;
}

export function generatePass(bytesCount = 8) {
    return randomBytes(bytesCount).toString("hex");
}
