import clsx from "clsx";
import { Cog, Inbox as InboxIcon, Mail, Plus } from "lucide-react";

import type { Inbox } from "../../shared/types";

interface SidebarProps {
    activeView: "mail" | "settings";
    connected: boolean;
    inboxes: Inbox[];
    onOpenSettings: () => void;
    onSelectInbox: (id: string) => void;
    selectedInboxId: string;
}

export function Sidebar({
    activeView,
    connected,
    inboxes,
    onOpenSettings,
    onSelectInbox,
    selectedInboxId,
}: SidebarProps) {
    return (
        <aside
            className="w-64 px-2 pt-2 flex-shrink-0 flex flex-col h-screen"
            style={{ background: "#1d1d24ff" }}
        >
            <div className="px-4 py-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-white" />
                </div>

                <span className="font-bold text-xl text-white text-base tracking-tight">
                    KafraInbox
                </span>
            </div>

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
                                    className={clsx(
                                        "w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-colors",
                                        {
                                            "bg-zinc-700/60 text-white":
                                                isSelected,
                                            "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200":
                                                !isSelected,
                                        },
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <InboxIcon
                                            className={clsx(
                                                "flex-shrink-0 h-4 w-4",
                                                {
                                                    "text-blue-400": isSelected,
                                                    "text-zinc-500":
                                                        !isSelected,
                                                },
                                            )}
                                        />

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

                <button
                    onClick={onOpenSettings}
                    className="mt-1 w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Inbox
                </button>
            </div>

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
                    className={clsx(
                        `flex items-center gap-2.5 py-2 rounded-md text-sm transition-colors w-full`,
                        {
                            "bg-zinc-700/60 text-white":
                                activeView === "settings",
                            "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200":
                                activeView !== "settings",
                        },
                    )}
                >
                    <Cog className="w-4 h-4" />
                    Settings
                </button>
            </div>
        </aside>
    );
}
