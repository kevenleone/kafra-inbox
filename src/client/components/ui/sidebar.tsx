import clsx from "clsx";
import {
    ChevronLeft,
    ChevronRight,
    Cog,
    Inbox as InboxIcon,
    LogOut,
    Mail,
    Plus,
} from "lucide-react";
import { useState } from "react";

import { useAuth } from "../../context/auth";

import type { Inbox } from "../../../shared/types";

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
    const { username, signOut } = useAuth();
    const [collapsed, setCollapsed] = useState(
        () => localStorage.getItem("@kafrainbox/sidebar:collapsed") === "true",
    );

    function toggleCollapsed() {
        setCollapsed((collapsed) => {
            localStorage.setItem(
                "@kafrainbox/sidebar:collapsed",
                String(!collapsed),
            );

            return !collapsed;
        });
    }

    return (
        <aside
            className={clsx(
                "duration-200 flex-shrink-0 flex flex-col h-screen transition-all",
                {
                    "px-1 pt-2 w-16": collapsed,
                    "px-2 pt-2 w-64": !collapsed,
                },
            )}
            style={{ background: "#1d1d24ff" }}
        >
            <div
                className={clsx("flex items-center py-4", {
                    "flex-col gap-2 px-2": collapsed,
                    "justify-between px-4": !collapsed,
                })}
            >
                <div className="flex items-center gap-2.5">
                    <div className="bg-blue-500 flex flex-shrink-0 items-center h-7 justify-center rounded-md w-7">
                        <Mail className="h-4 text-white w-4" />
                    </div>

                    {!collapsed && (
                        <span className="font-bold text-white tracking-tight">
                            KafraInbox
                        </span>
                    )}
                </div>

                <button
                    onClick={toggleCollapsed}
                    className="hover:bg-zinc-800/70 hover:text-zinc-300 text-zinc-500 transition-colors rounded-md p-0.5"
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronLeft className="w-4 h-4" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
                {!collapsed && (
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2 mb-1.5">
                        Inboxes
                    </p>
                )}

                <ul className="space-y-0.5">
                    {inboxes.map((inbox) => {
                        const isSelected =
                            activeView === "mail" &&
                            selectedInboxId === inbox.id;

                        return (
                            <li key={inbox.id}>
                                <button
                                    className={clsx(
                                        "w-full flex items-center rounded-md text-sm transition-colors",
                                        collapsed
                                            ? "justify-center px-2 py-2"
                                            : "justify-between px-2.5 py-2",
                                        {
                                            "bg-zinc-700/60 text-white":
                                                isSelected,
                                            "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200":
                                                !isSelected,
                                        },
                                    )}
                                    onClick={() => onSelectInbox(inbox.id)}
                                    title={inbox.name}
                                >
                                    <div
                                        className={clsx("flex items-center", {
                                            "gap-2.5 min-w-0": !collapsed,
                                        })}
                                    >
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

                                        {!collapsed && (
                                            <span className="truncate font-semibold">
                                                {inbox.name}
                                            </span>
                                        )}
                                    </div>

                                    {!collapsed && inbox.emailCount > 0 && (
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
                    className={clsx(
                        "mt-1 w-full flex items-center rounded-md text-sm text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300 transition-colors",
                        collapsed
                            ? "justify-center px-2 py-2"
                            : "gap-2 px-2.5 py-2",
                    )}
                    onClick={onOpenSettings}
                    title="New Inbox"
                >
                    <Plus className="w-3.5 h-3.5 flex-shrink-0" />

                    {!collapsed && "New Inbox"}
                </button>
            </div>

            <div
                className={clsx("border-t border-zinc-800 py-3 space-y-1", {
                    "px-3": !collapsed,
                    "px-1": collapsed,
                })}
            >
                <div
                    className={clsx("flex items-center mb-2 px-0.5", {
                        "gap-2": !collapsed,
                        "justify-center": collapsed,
                    })}
                >
                    <span
                        className={clsx(
                            "flex-shrink-0 h-1.5 rounded-full w-1.5 ",
                            {
                                "bg-green-400": connected,
                                "bg-red-400": !connected,
                            },
                        )}
                        title={connected ? "Connected" : "Reconnecting…"}
                    />

                    {!collapsed && (
                        <span className="text-xs text-zinc-500">
                            {connected ? "Connected" : "Reconnecting…"}
                        </span>
                    )}
                </div>

                <button
                    className={clsx(
                        "flex items-center py-2 rounded-md text-sm transition-colors w-full",
                        collapsed
                            ? "justify-center px-2 gap-0"
                            : "gap-2.5 px-2",
                        {
                            "bg-zinc-700/60 text-white":
                                activeView === "settings",
                            "text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200":
                                activeView !== "settings",
                        },
                    )}
                    onClick={onOpenSettings}
                    title="Settings"
                >
                    <Cog className="w-4 h-4 flex-shrink-0" />

                    {!collapsed && "Settings"}
                </button>

                {username && username !== "anonymous" && (
                    <div
                        className={clsx(
                            "flex items-center pt-1",
                            collapsed
                                ? "flex-col gap-1"
                                : "gap-2 justify-between",
                        )}
                    >
                        {!collapsed && (
                            <span
                                className="text-xs text-zinc-400 truncate px-2 min-w-0"
                                title={username}
                            >
                                {username}
                            </span>
                        )}

                        <button
                            className="flex-shrink-0 flex items-center justify-center p-1.5 rounded-md text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-300 transition-colors"
                            onClick={signOut}
                            title="Sign out"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
