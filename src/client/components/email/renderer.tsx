import { useEffect, useRef } from "react";

import type { Email } from "../../../shared/types";
import { inlineAttachments } from "../../utils/attachment";
import { NoContent } from "../no-content";

export function EmailRenderer(email: Email) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!email) {
            return;
        }

        const prepared = inlineAttachments(
            email.attachments,
            email.html as string,
        );

        const frame = iframeRef.current;
        if (!frame) return;
        const doc = frame.contentDocument ?? frame.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(prepared);
        doc.close();
    }, [email]);

    if (!email) {
        return <NoContent message="No HTML body" />;
    }

    return (
        <iframe
            className="email-renderer"
            ref={iframeRef}
            sandbox="allow-same-origin"
            title="Email preview"
        />
    );
}
