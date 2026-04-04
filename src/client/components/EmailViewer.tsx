import { useEffect, useRef, useState } from "react";
import type { Attachment, Email } from "../../shared/types";

type Tab = "html" | "text" | "raw" | "headers";

interface EmailViewerProps {
    email: Email | null;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(timestamp: string): string {
    return new Date(timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Replace cid: image references with inline data URIs */
function inlineAttachments(html: string, attachments: Attachment[]): string {
    return html.replace(/cid:([^"'\s)]+)/g, (_, cid: string) => {
        const att = attachments.find((a) => a.cid === cid);
        if (att) return `data:${att.contentType};base64,${att.content}`;
        return `cid:${cid}`;
    });
}

function HtmlFrame({
    html,
    attachments,
}: {
    html: string;
    attachments: Attachment[];
}) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const prepared = inlineAttachments(html, attachments);

    useEffect(() => {
        const frame = iframeRef.current;
        if (!frame) return;
        const doc = frame.contentDocument ?? frame.contentWindow?.document;
        if (!doc) return;
        doc.open();
        doc.write(prepared);
        doc.close();
    }, [prepared]);

    return (
        <iframe
            ref={iframeRef}
            title="Email preview"
            className="email-frame"
            sandbox="allow-same-origin"
        />
    );
}

function downloadAttachment(emailId: string, index: number, filename: string) {
    const a = document.createElement("a");
    a.href = `/api/emails/${emailId}/attachments/${index}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function EmailViewer({ email }: EmailViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("html");
    useEffect(() => setActiveTab("html"), [email?.id]);

    if (!email) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <svg
                    className="w-14 h-14 mb-4 opacity-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                </svg>
                <p className="text-sm font-medium">
                    Select an email to preview
                </p>
                <p className="text-xs mt-1 text-gray-400">
                    Choose an email from the list to preview
                </p>
            </div>
        );
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: "html", label: "HTML" },
        { id: "text", label: "Text" },
        { id: "raw", label: "Raw" },
        { id: "headers", label: "Headers" },
    ];

    const hasAttachments = email.attachments.length > 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Header */}
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
                            <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
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
                                <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                    />
                                </svg>
                                {email.attachments.length} Attachment
                                {email.attachments.length !== 1 ? "s" : ""}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div className="px-6 border-b border-gray-100 bg-white">
                <nav className="flex -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? "border-blue-500 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto min-h-0">
                {activeTab === "html" &&
                    (email.html ? (
                        <HtmlFrame
                            html={email.html}
                            attachments={email.attachments}
                        />
                    ) : (
                        <NoContent message="No HTML body" />
                    ))}
                {activeTab === "text" &&
                    (email.text ? (
                        <pre className="raw-view p-6 text-sm text-slate-700">
                            {email.text}
                        </pre>
                    ) : (
                        <NoContent message="No plain text body" />
                    ))}
                {activeTab === "raw" && (
                    <pre className="raw-view p-6 text-slate-600">
                        {email.raw}
                    </pre>
                )}
                {activeTab === "headers" && (
                    <div className="p-6">
                        <table className="w-full text-xs">
                            <tbody>
                                {Object.entries(email.headers).map(
                                    ([key, value]) => (
                                        <tr
                                            key={key}
                                            className="border-b border-gray-100 hover:bg-gray-50"
                                        >
                                            <td className="py-2 pr-4 font-medium text-slate-600 w-36 align-top whitespace-nowrap">
                                                {key}
                                            </td>
                                            <td className="py-2 text-slate-500 break-all">
                                                {value}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Attachments footer */}
            {hasAttachments && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                        {email.attachments.length} Attachment
                        {email.attachments.length !== 1 ? "s" : ""}
                    </p>
                    <ul className="flex flex-col gap-1.5">
                        {email.attachments.map((att, i) => (
                            <li
                                key={i}
                                className="flex items-center justify-between"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-3.5 h-3.5 text-blue-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                            />
                                        </svg>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">
                                            {att.filename}
                                        </p>
                                        <p className="text-[11px] text-gray-400">
                                            {att.contentType} ·{" "}
                                            {formatSize(att.size)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() =>
                                        downloadAttachment(
                                            email.id,
                                            i,
                                            att.filename,
                                        )
                                    }
                                    className="ml-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                                >
                                    <svg
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                    </svg>
                                    Download
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="text-gray-400 w-8 flex-shrink-0">{label}:</span>
            <span className="text-slate-600 break-all">{value}</span>
        </div>
    );
}

function NoContent({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center h-full py-20 text-gray-400">
            <p className="text-sm">{message}</p>
        </div>
    );
}
