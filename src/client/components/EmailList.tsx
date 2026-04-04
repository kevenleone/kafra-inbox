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
        <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col h-screen bg-white">
            {/* Header: inbox name + actions */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h1 className="text-sm font-semibold text-slate-800 truncate">
                    {inboxName}
                </h1>
                <div className="flex items-center gap-1">
                    {total > 0 && (
                        <button
                            onClick={onClearInbox}
                            title="Clear all emails"
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Message count + search */}
            <div className="px-3 py-2.5 border-b border-gray-100 space-y-2">
                {/* Count row */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                        {loading
                            ? "Loading…"
                            : `${total} message${total !== 1 ? "s" : ""}`}
                    </span>
                    <div className="flex items-center gap-0.5">
                        <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
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
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <button className="p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors">
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
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <svg
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
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
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Email list */}
            <ul className="flex-1 overflow-y-auto email-list-scroll divide-y divide-gray-100">
                {emails.length === 0 && !loading && (
                    <li className="flex flex-col items-center justify-center h-full text-center px-6 py-12 text-gray-400">
                        <svg
                            className="w-10 h-10 mb-3 opacity-25"
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
                        <p className="text-sm font-medium text-gray-500">
                            No emails yet
                        </p>
                        <p className="text-xs mt-1 text-gray-400">
                            Send to localhost:1025
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
                            {/* Unread dot */}
                            {!email.isRead && !isSelected && (
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}

                            <div className="px-4 py-3 pl-5">
                                {/* Sender + time */}
                                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                                    <span
                                        className={`text-xs truncate ${!email.isRead ? "font-semibold text-slate-900" : "text-slate-600"}`}
                                    >
                                        {extractDisplayName(email.from)}
                                    </span>
                                    <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                                        {formatTime(email.timestamp)}
                                    </span>
                                </div>

                                {/* Subject */}
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
                                            <svg
                                                className="w-3 h-3 text-gray-400"
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
                                        )}
                                        <span className="text-[11px] text-gray-400">
                                            {formatSize(email.size)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Delete button (hover) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteEmail(email.id);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                title="Delete"
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
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
