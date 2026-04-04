import { Download, Paperclip } from "lucide-react";

import type { Email } from "../../../shared/types";
import { formatDate, formatSize } from "../../utils/format";
import { MetaRow } from "../meta-row";

export function EmailHeader({ email }: { email: Email }) {
    const hasAttachments = email.attachments.length > 0;

    return (
        <div className="px-6 py-4 border-b border-gray-100">
            {/* Subject + date */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-base font-semibold text-slate-900 leading-snug">
                    {email.subject}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0 text-gray-400">
                    <span className="text-xs">
                        {formatDate(email.timestamp)}
                    </span>
                    <button
                        title="Download raw email"
                        className="p-1 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* From / To / CC / BCC */}
            <div className="space-y-1 text-xs mb-3">
                <MetaRow label="From" value={email.from} />
                <MetaRow label="To" value={email.to.join(", ")} />
                {email.cc.length > 0 && (
                    <MetaRow label="CC" value={email.cc.join(", ")} />
                )}
                {email.bcc.length > 0 && (
                    <MetaRow label="BCC" value={email.bcc.join(", ")} />
                )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
                <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        email.isRead
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-700"
                    }`}
                >
                    {email.isRead ? "Read" : "Unread"}
                </span>
                <span className="text-xs text-gray-400">
                    {formatSize(email.size)}
                </span>

                {hasAttachments && (
                    <>
                        <span className="text-gray-200">·</span>
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Paperclip className="w-3 h-3" />
                            {email.attachments.length} Attachment
                            {email.attachments.length !== 1 ? "s" : ""}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
