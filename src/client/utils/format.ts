export function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString(undefined, {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
    });
}

export function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) {
        return "just now";
    }

    if (diffSec < 3600) {
        return `${Math.floor(diffSec / 60)}m ago`;
    }

    if (diffSec < 86400) {
        return date.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    });
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
