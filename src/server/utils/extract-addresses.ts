import type { AddressObject } from "mailparser";

export function extractAddresses(
    field: AddressObject | AddressObject[] | undefined,
): string[] {
    if (!field) {
        return [];
    }

    const addresses = Array.isArray(field) ? field : [field];

    return addresses.flatMap(
        (address) =>
            (address.value ?? [])
                .map((value) =>
                    value.address
                        ? `${value.name ? value.name + " " : ""}<${value.address}>`.trim()
                        : value.name,
                )
                .filter(Boolean) as string[],
    );
}
