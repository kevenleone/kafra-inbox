import type { Email } from "../../../shared/types";
import { storage } from "../../persistence/storage";
import { environment } from "../../utils/environment";
import { buildDev, buildFull, buildShort } from "./ntfy.templates";

function getBody(email: Email, inboxName: string) {
    const preset = environment.KAFRAINBOX_NTFY_PRESET;

    if (preset === "dev") {
        return buildDev(email, inboxName);
    }

    if (preset === "short") {
        return buildShort(email, inboxName) 
    }

    return buildFull(email, inboxName);
}

export async function notifyNewEmail(email: Email): Promise<void> {
    if (!environment.KAFRAINBOX_NTFY_URL) {
        return;
    };

    const inbox = storage.getInbox(email.inboxId);
    const inboxName = inbox?.name ?? email.inboxId;

    const headers: Record<string, string> = {
        "Content-Type": "text/plain",
        "Markdown": "yes",
        "Title": email.subject || "(no subject)",
        "Tags": "envelope",
    };

    if (environment.KAFRAINBOX_NTFY_TOKEN) {
        headers["Authorization"] = `Bearer ${environment.KAFRAINBOX_NTFY_TOKEN}`;
    }

    try {
        await fetch(environment.KAFRAINBOX_NTFY_URL, {
            body: getBody(email, inboxName),
            method: "POST",
            headers,
        });

        console.log(`[NTFY] notification sent to ${environment.KAFRAINBOX_NTFY_URL}`)

    } catch (error) {
        console.error("[NTFY] Failed to send notification:", error);
    }
}