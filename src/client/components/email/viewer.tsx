import { Download, Mail, Paperclip } from "lucide-react";
import { useEffect, useState } from "react";

import type { Email } from "../../../shared/types";
import { downloadAttachment } from "../../utils/attachment";
import { formatSize } from "../../utils/format";
import { NoContent } from "../no-content";
import { EmailHeader } from "./header";
import { EmailRenderer } from "./renderer";

interface EmailViewerProps {
    email: Email | null;
}

type Tab = "html" | "text" | "raw" | "headers";

const tabs: { id: Tab; label: string }[] = [
    { id: "html", label: "HTML" },
    { id: "text", label: "Text" },
    { id: "raw", label: "Raw" },
    { id: "headers", label: "Headers" },
];

function EmailTabRender({
    activeTab,
    email,
}: {
    activeTab: Tab;
    email: Email;
}) {
    if (activeTab === "html") {
        return <EmailRenderer {...email} />;
    }

    if (activeTab === "headers") {
        return (
            <div className="p-6">
                <table className="w-full text-xs">
                    <tbody>
                        {Object.entries(email.headers).map(([key, value]) => (
                            <tr
                                className="border-b border-gray-100 hover:bg-gray-50"
                                key={key}
                            >
                                <td className="py-2 pr-4 font-medium text-slate-600 w-36 align-top whitespace-nowrap">
                                    {key}
                                </td>

                                <td className="py-2 text-slate-500 break-all">
                                    {value}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (activeTab === "raw") {
        return <pre className="raw-view p-6 text-slate-600">{email.raw}</pre>;
    }

    if (activeTab === "text") {
        if (email.text) {
            return (
                <pre className="raw-view p-6 text-sm text-slate-700">
                    {email.text}
                </pre>
            );
        }

        return <NoContent message="No plain text body" />;
    }

    return null;
}

export function EmailViewer({ email }: EmailViewerProps) {
    const [activeTab, setActiveTab] = useState<Tab>("html");

    useEffect(() => setActiveTab("html"), [email?.id]);

    if (!email) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <Mail className="w-14 h-14 mb-4 opacity-20" strokeWidth={1} />

                <p className="text-sm font-medium">
                    Select an email to preview
                </p>

                <p className="text-xs mt-1 text-gray-400">
                    Choose an email from the list to preview
                </p>
            </div>
        );
    }

    const hasAttachments = email.attachments.length > 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <EmailHeader email={email} />

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

            <div className="flex-1 overflow-auto min-h-0">
                <EmailTabRender activeTab={activeTab} email={email} />
            </div>

            {hasAttachments && (
                <div className="border-t border-gray-100 bg-gray-50 px-6 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                        {email.attachments.length} Attachment
                        {email.attachments.length !== 1 ? "s" : ""}
                    </p>

                    <ul className="flex flex-col gap-1.5">
                        {email.attachments.map((attachment, i) => (
                            <li
                                className="flex items-center justify-between"
                                key={i}
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">
                                            {attachment.filename}
                                        </p>

                                        <p className="text-[11px] text-gray-400">
                                            {attachment.contentType} ·{" "}
                                            {formatSize(attachment.size)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    className="ml-3 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                                    onClick={() =>
                                        downloadAttachment(
                                            email.id,
                                            i,
                                            attachment.filename,
                                        )
                                    }
                                >
                                    <Download className="w-3.5 h-3.5" />
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
