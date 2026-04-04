import type { Attachment } from "../../shared/types";

export function downloadAttachment(
    emailId: string,
    index: number,
    filename: string,
) {
    const a = document.createElement("a");

    a.href = `/api/emails/${emailId}/attachments/${index}`;
    a.download = filename;
    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);
}

/** Replace cid: image references with inline data URIs */
export function inlineAttachments(
    attachments: Attachment[],
    html: string,
): string {
    return html.replace(/cid:([^"'\s)]+)/g, (_, cid: string) => {
        const attachment = attachments.find(
            (attachment) => attachment.cid === cid,
        );

        return attachment
            ? `data:${attachment.contentType};base64,${attachment.content}`
            : `cid:${cid}`;
    });
}
