import { useCallback, useEffect, useRef, useState } from "react";

import type { Email, Inbox, WsMessage } from "../shared/types";
import { EmailList } from "./components/email/list";
import { EmailViewer } from "./components/email/viewer";
import { Settings } from "./components/ui/settings";
import { Sidebar } from "./components/ui/sidebar";

type View = "mail" | "settings";

function matchesSearch(email: Email, query: string): boolean {
    const searchQuery = query.toLowerCase();

    return (
        email.subject.toLowerCase().includes(searchQuery) ||
        email.from.toLowerCase().includes(searchQuery) ||
        email.to.some((t) => t.toLowerCase().includes(searchQuery)) ||
        (email.text?.toLowerCase().includes(searchQuery) ?? false)
    );
}

export default function App() {
    const [connected, setConnected] = useState(false);
    const [emails, setEmails] = useState<Email[]>([]);
    const [inboxes, setInboxes] = useState<Inbox[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [selectedInboxId, setSelectedInboxId] = useState(
        () => new URLSearchParams(location.search).get("inbox") ?? "default",
    );
    const [total, setTotal] = useState(0);
    const [view, setView] = useState<View>("mail");

    const searchRef = useRef(search);
    const selectedInboxIdRef = useRef(selectedInboxId);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        selectedInboxIdRef.current = selectedInboxId;

        const params = new URLSearchParams(location.search);

        params.set("inbox", selectedInboxId);
        history.replaceState(null, "", `?${params}`);
    }, [selectedInboxId]);

    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    // ── WebSocket
    useEffect(() => {
        function connect() {
            const protocol = location.protocol === "https:" ? "wss:" : "ws:";

            const ws = new WebSocket(`${protocol}//${location.host}/ws`);

            wsRef.current = ws;

            ws.onopen = () => setConnected(true);

            ws.onmessage = (event: MessageEvent<string>) => {
                const msg = JSON.parse(event.data) as WsMessage;

                if (msg.type === "new_email") {
                    setEmails((prev) => {
                        if (msg.email.inboxId !== selectedInboxIdRef.current)
                            return prev;
                        if (
                            searchRef.current &&
                            !matchesSearch(msg.email, searchRef.current)
                        )
                            return prev;
                        return [msg.email, ...prev];
                    });

                    setTotal((total) => total + 1);

                    setInboxes((prev) =>
                        prev.map((inbox) =>
                            inbox.id === msg.email.inboxId
                                ? {
                                      ...inbox,
                                      emailCount: inbox.emailCount + 1,
                                      unreadCount: inbox.unreadCount + 1,
                                  }
                                : inbox,
                        ),
                    );
                } else if (msg.type === "email_deleted") {
                    setEmails((emails) =>
                        emails.filter((email) => email.id !== msg.id),
                    );

                    setTotal((total) => Math.max(0, total - 1));

                    setSelectedEmail((selectedEmail) =>
                        selectedEmail?.id === msg.id ? null : selectedEmail,
                    );
                } else if (msg.type === "inbox_cleared") {
                    if (msg.inboxId === selectedInboxIdRef.current) {
                        setEmails([]);
                        setTotal(0);
                        setSelectedEmail(null);
                    }

                    setInboxes((inboxes) =>
                        inboxes.map((inbox) =>
                            inbox.id === msg.inboxId
                                ? { ...inbox, emailCount: 0, unreadCount: 0 }
                                : inbox,
                        ),
                    );
                }
            };

            ws.onclose = () => {
                setConnected(false);
                setTimeout(connect, 3000);
            };

            ws.onerror = () => ws.close();
        }

        connect();
        return () => {
            wsRef.current?.close();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Load inboxes ──────────────────────────────────────────────────────────
    useEffect(() => {
        fetch("/api/inboxes")
            .then((response) => response.json() as Promise<Inbox[]>)
            .then(setInboxes)
            .catch(console.error);
    }, []);

    // ── Load emails when inbox/search changes ─────────────────────────────────
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ inboxId: selectedInboxId });

        if (search) {
            params.set("search", search);
        }

        fetch(`/api/emails?${params}`)
            .then(
                (response) =>
                    response.json() as Promise<{
                        data: Email[];
                        total: number;
                    }>,
            )
            .then((data) => {
                setEmails(data.data);
                setTotal(data.total);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedInboxId, search]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSelectEmail = useCallback(async (email: Email) => {
        const full = await fetch(`/api/emails/${email.id}`).then(
            (response) => response.json() as Promise<Email>,
        );

        setSelectedEmail(full);

        setEmails((prevEmails) =>
            prevEmails.map((prevEmail) =>
                prevEmail.id === email.id
                    ? { ...prevEmail, isRead: true }
                    : prevEmail,
            ),
        );

        setInboxes((prevInboxes) =>
            prevInboxes.map((inbox) =>
                inbox.id === email.inboxId && !email.isRead
                    ? {
                          ...inbox,
                          unreadCount: Math.max(0, inbox.unreadCount - 1),
                      }
                    : inbox,
            ),
        );
    }, []);

    const handleDeleteEmail = useCallback(
        async (id: string) => {
            await fetch(`/api/emails/${id}`, { method: "DELETE" });
            setEmails((prev) => prev.filter((e) => e.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            if (selectedEmail?.id === id) setSelectedEmail(null);
        },
        [selectedEmail],
    );

    const handleClearInbox = useCallback(async () => {
        await fetch(`/api/emails?inboxId=${selectedInboxId}`, {
            method: "DELETE",
        });

        setEmails([]);
        setTotal(0);
        setSelectedEmail(null);
        setInboxes((prevInboxes) =>
            prevInboxes.map((inbox) =>
                inbox.id === selectedInboxId
                    ? { ...inbox, emailCount: 0, unreadCount: 0 }
                    : inbox,
            ),
        );
    }, [selectedInboxId]);

    const handleCreateInbox = useCallback(
        async (name: string): Promise<{ error?: string }> => {
            const res = await fetch("/api/inboxes", {
                body: JSON.stringify({ name }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });

            const data = (await res.json()) as Inbox & { error?: string };

            if (!res.ok) {
                return { error: data.error ?? "Failed to create inbox" };
            }

            setInboxes((prevInboxes) => [...prevInboxes, data]);

            return {};
        },
        [],
    );

    const handleDeleteInbox = useCallback(
        async (id: string) => {
            await fetch(`/api/inboxes/${id}`, { method: "DELETE" });

            setInboxes((prevInboxes) =>
                prevInboxes.filter((inbox) => inbox.id !== id),
            );

            if (selectedInboxId === id) {
                setSelectedInboxId("default");
            }
        },
        [selectedInboxId],
    );

    const selectedInbox = inboxes.find((i) => i.id === selectedInboxId);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                activeView={view}
                connected={connected}
                inboxes={inboxes}
                selectedInboxId={selectedInboxId}
                onOpenSettings={() => setView("settings")}
                onSelectInbox={(id) => {
                    setSelectedInboxId(id);
                    setView("mail");
                }}
            />

            {view === "settings" ? (
                <Settings
                    inboxes={inboxes}
                    onBack={() => setView("mail")}
                    onCreateInbox={handleCreateInbox}
                    onDeleteInbox={handleDeleteInbox}
                />
            ) : (
                <>
                    <EmailList
                        emails={emails}
                        inboxName={selectedInbox?.name ?? "Inbox"}
                        loading={loading}
                        onClearInbox={handleClearInbox}
                        onDeleteEmail={handleDeleteEmail}
                        onSearch={setSearch}
                        onSelectEmail={handleSelectEmail}
                        search={search}
                        selectedId={selectedEmail?.id}
                        total={total}
                    />

                    <EmailViewer email={selectedEmail} />
                </>
            )}
        </div>
    );
}
