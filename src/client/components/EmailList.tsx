import {
    ChevronLeft,
    ChevronRight,
    Mail,
    Paperclip,
    Search,
    Trash2,
    X,
} from "lucide-react";
import React from "react";

import type { Email } from "../../shared/types";

interface EmailListProps {
    emails: Email[];
    total: number;
    search: string;
    onSearch: (q: string) => void;
    selectedId: string | undefined;
    onSelectEmail: (email: Email) => void;
    onDeleteEmail: (id: string) => void;
    onClearInbox: () => void;
    loading: boolean;
    inboxName: string;
}

function formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
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

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function unquote(text: string) {
    return text.replaceAll('"', "");
}

function extractDisplayName(addr: string): string {
    const match = addr.match(/^([^<]+)<[^>]+>/);
    if (match) return match[1]!.trim();
    const emailMatch = addr.match(/<([^>]+)>/);
    return emailMatch ? emailMatch[1]! : addr;
}

function extractEmail(addr: string): string {
    const match = addr.match(/<([^>]+)>/);
    return match ? match[1]! : addr;
}

export function EmailList({
    emails,
    total,
    search,
    onSearch,
    selectedId,
    onSelectEmail,
    onDeleteEmail,
    onClearInbox,
    loading,
    inboxName,
}: EmailListProps) {
    return (
        <div className="w-96 flex-shrink-0 border-r border-gray-200 flex flex-col h-screen bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-slate-800 truncate">
                    {inboxName}
                </h1>

                <div className="flex items-center gap-1">
                    {total > 0 && (
                        <button
                            onClick={onClearInbox}
                            title="Clear all emails"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-3 py-2.5 border-b border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {loading
                            ? "Loading…"
                            : `${total} message${total !== 1 ? "s" : ""}`}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            onSearch(e.target.value)
                        }
                        className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-100 rounded-md border border-transparent focus:outline-none focus:border-blue-400 focus:bg-white transition-colors placeholder-gray-400"
                    />

                    {search && (
                        <button
                            onClick={() => onSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <ul className="flex-1 overflow-y-auto email-list-scroll divide-y divide-gray-100">
                {emails.length === 0 && !loading && (
                    <li className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-gray-400">
                        <Mail
                            className="w-10 h-10 mb-3 opacity-25"
                            strokeWidth={1}
                        />

                        <p className="text-sm font-medium text-gray-500">
                            No emails yet
                        </p>

                        <p className="text-xs mt-1 text-gray-400">
                            Send a test email or configure your app to use this
                            inbox
                        </p>
                    </li>
                )}

                {emails.map((email) => {
                    const isSelected = selectedId === email.id;
                    return (
                        <li
                            key={email.id}
                            onClick={() => onSelectEmail(email)}
                            className={`group relative cursor-pointer transition-colors ${
                                isSelected
                                    ? "bg-blue-50 border-l-2 border-l-blue-500"
                                    : "hover:bg-gray-50 border-l-2 border-l-transparent"
                            }`}
                        >
                            {!email.isRead && !isSelected && (
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            )}

                            <div className="px-4 py-3 pl-6">
                                {/* Sender + time */}
                                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                    <span
                                        className={`text-xs truncate ${!email.isRead ? "font-semibold text-slate-900" : "text-slate-600"}`}
                                    >
                                        {unquote(
                                            extractDisplayName(email.from),
                                        )}
                                    </span>
                                    <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                                        {formatTime(email.timestamp)}
                                    </span>
                                </div>

                                <p
                                    className={`text-xs truncate mb-0.5 ${!email.isRead ? "font-medium text-slate-800" : "text-slate-500"}`}
                                >
                                    {email.subject}
                                </p>

                                {/* To + size + attachment */}
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] text-gray-400 truncate">
                                        {email.to.map(extractEmail).join(", ")}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                                        {email.attachments.length > 0 && (
                                            <Paperclip className="w-3 h-3 text-gray-400" />
                                        )}
                                        <span className="text-[11px] text-gray-400">
                                            {formatSize(email.size)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={(event) => {
                                    event.stopPropagation();

                                    onDeleteEmail(email.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
