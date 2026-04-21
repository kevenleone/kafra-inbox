import { describe, expect, it } from "bun:test";

import { extractAddresses } from "./extract-addresses";

const addr = (name: string, address?: string) => ({
    html: "",
    text: "",
    value: [{ address, name }],
});

describe("extractAddresses", () => {
    it("returns empty array for undefined", () => {
        expect(extractAddresses(undefined)).toEqual([]);
    });

    it("formats address with display name", () => {
        expect(extractAddresses(addr("Jane Doe", "jane@example.com"))).toEqual([
            "Jane Doe <jane@example.com>",
        ]);
    });

    it("formats address without display name", () => {
        expect(extractAddresses(addr("", "jane@example.com"))).toEqual([
            "<jane@example.com>",
        ]);
    });

    it("returns name only when address is absent", () => {
        expect(extractAddresses(addr("Group Name"))).toEqual(["Group Name"]);
    });

    it("filters out entries with neither name nor address", () => {
        expect(extractAddresses(addr(""))).toEqual([]);
    });

    it("handles an array of AddressObjects", () => {
        const input = [
            addr("Alice", "alice@example.com"),
            addr("Bob", "bob@example.com"),
        ];
        expect(extractAddresses(input)).toEqual([
            "Alice <alice@example.com>",
            "Bob <bob@example.com>",
        ]);
    });

    it("flattens multiple values within one AddressObject", () => {
        const input = {
            html: "",
            text: "",
            value: [
                { name: "Alice", address: "alice@example.com" },
                { name: "Bob", address: "bob@example.com" },
            ],
        };
        expect(extractAddresses(input)).toEqual([
            "Alice <alice@example.com>",
            "Bob <bob@example.com>",
        ]);
    });
});
