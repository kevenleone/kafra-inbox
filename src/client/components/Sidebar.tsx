import React from "react";
import type { Inbox } from "../../shared/types";

interface SidebarProps {
    inboxes: Inbox[];
    selectedInboxId: string;
    onSelectInbox: (id: string) => void;
    connected: boolean;
    onOpenSettings: () => void;
    activeView: "mail" | "settings";
}

export function Sidebar({
    inboxes,
    selectedInboxId,
    onSelectInbox,
    connected,
    onOpenSettings,
    activeView,
}: SidebarProps) {
    return (
        <aside
            className="w-64 px-2 pt-2 flex-shrink-0 flex flex-col h-screen"
            style={{ background: "#1d1d24ff" }}
        >
            {/* Logo */}
            <div className="px-4 py-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>

                <span className="font-bold text-xl text-white text-base tracking-tight">
                    Mail4All
                </span>
            </div>

            {/* Inboxes section */}
            <div className="flex-1 overflow-y-auto px-2 py-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">
                    Inboxes
                </p>

                <ul className="space-y-0.5">
                    {inboxes.map((inbox) => {
                        const isSelected =
                            activeView === "mail" &&
                            selectedInboxId === inbox.id;
                        return (
                            <li key={inbox.id}>
                                <button
                                    onClick={() => onSelectInbox(inbox.id)}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors ${
                                        isSelected
                                            ? "bg-zinc-700/60 text-white"
                                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <svg
                                            className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-400" : "text-zinc-500"}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                            />
                                        </svg>

                                        <span className="truncate font-semibold">
                                            {inbox.name}
                                        </span>
                                    </div>
                                    {inbox.emailCount > 0 && (
                                        <span className="text-xs text-zinc-400 tabular-nums ml-1">
                                            {inbox.emailCount}
                                        </span>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Add inbox shortcut */}
                <button
                    onClick={onOpenSettings}
                    className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300 transition-colors"
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
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    New Inbox
                </button>
            </div>

            {/* Bottom: connection status + settings */}
            <div className="px-3 py-3 border-t border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 px-0.5 mb-2">
                    <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? "bg-green-400" : "bg-red-400"}`}
                    />
                    <span className="text-xs text-zinc-500">
                        {connected ? "Connected" : "Reconnecting…"}
                    </span>
                </div>

                <button
                    onClick={onOpenSettings}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                        activeView === "settings"
                            ? "bg-zinc-700/60 text-white"
                            : "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200"
                    }`}
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
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    Settings
                </button>
            </div>
        </aside>
    );
}
