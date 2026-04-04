export function extractDisplayName(addr: string): string {
    const match = addr.match(/^([^<]+)<[^>]+>/);
    if (match) return match[1]!.trim();
    const emailMatch = addr.match(/<([^>]+)>/);
    return emailMatch ? emailMatch[1]! : addr;
}

export function extractEmail(addr: string): string {
    const match = addr.match(/<([^>]+)>/);
    return match ? match[1]! : addr;
}

export function unquote(text: string) {
    return text.replaceAll('"', "");
}
