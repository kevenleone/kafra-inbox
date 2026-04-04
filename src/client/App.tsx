import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Email, Inbox, WsMessage } from "../shared/types";
import { Sidebar } from "./components/Sidebar";
import { EmailList } from "./components/EmailList";
import { EmailViewer } from "./components/EmailViewer";
import { Settings } from "./components/Settings";

type View = "mail" | "settings";

function App() {
    const [view, setView] = useState<View>("mail");
    const [inboxes, setInboxes] = useState<Inbox[]>([]);
    const [selectedInboxId, setSelectedInboxId] = useState("default");
    const [emails, setEmails] = useState<Email[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const selectedInboxIdRef = useRef(selectedInboxId);
    const searchRef = useRef(search);

    useEffect(() => {
        selectedInboxIdRef.current = selectedInboxId;
    }, [selectedInboxId]);

    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useEffect(() => {
        function connect() {
            const proto = location.protocol === "https:" ? "wss:" : "ws:";
            const ws = new WebSocket(`${proto}//${location.host}/ws`);
            wsRef.current = ws;

            ws.onopen = () => setConnected(true);

            ws.onmessage = (event: MessageEvent<string>) => {
                const msg = JSON.parse(event.data) as WsMessage;

                if (msg.type === "new_email") {
                    setEmails((prev) => {
                        if (msg.email.inboxId !== selectedInboxIdRef.current) return prev;
                        if (searchRef.current && !matchesSearch(msg.email, searchRef.current))
                            return prev;
                        return [msg.email, ...prev];
                    });
                    setTotal((t) => t + 1);
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
                    setEmails((prev) => prev.filter((e) => e.id !== msg.id));
                    setTotal((t) => Math.max(0, t - 1));
                    setSelectedEmail((sel) =>
                        sel?.id === msg.id ? null : sel,
                    );
                } else if (msg.type === "inbox_cleared") {
                    if (msg.inboxId === selectedInboxIdRef.current) {
                        setEmails([]);
                        setTotal(0);
                        setSelectedEmail(null);
                    }
                    setInboxes((prev) =>
                        prev.map((inbox) =>
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
            .then((r) => r.json() as Promise<Inbox[]>)
            .then(setInboxes)
            .catch(console.error);
    }, []);

    // ── Load emails when inbox/search changes ─────────────────────────────────
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ inboxId: selectedInboxId });
        if (search) params.set("search", search);

        fetch(`/api/emails?${params}`)
            .then((r) => r.json() as Promise<{ data: Email[]; total: number }>)
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
            (r) => r.json() as Promise<Email>,
        );
        setSelectedEmail(full);
        setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)),
        );
        setInboxes((prev) =>
            prev.map((inbox) =>
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
        setInboxes((prev) =>
            prev.map((inbox) =>
                inbox.id === selectedInboxId
                    ? { ...inbox, emailCount: 0, unreadCount: 0 }
                    : inbox,
            ),
        );
    }, [selectedInboxId]);

    const handleCreateInbox = useCallback(
        async (name: string): Promise<{ error?: string }> => {
            const res = await fetch("/api/inboxes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            const data = (await res.json()) as Inbox & { error?: string };
            if (!res.ok)
                return { error: data.error ?? "Failed to create inbox" };
            setInboxes((prev) => [...prev, data]);
            return {};
        },
        [],
    );

    const handleDeleteInbox = useCallback(
        async (id: string) => {
            await fetch(`/api/inboxes/${id}`, { method: "DELETE" });
            setInboxes((prev) => prev.filter((inbox) => inbox.id !== id));
            if (selectedInboxId === id) setSelectedInboxId("default");
        },
        [selectedInboxId],
    );

    const selectedInbox = inboxes.find((i) => i.id === selectedInboxId);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                inboxes={inboxes}
                selectedInboxId={selectedInboxId}
                onSelectInbox={(id) => {
                    setSelectedInboxId(id);
                    setView("mail");
                }}
                connected={connected}
                onOpenSettings={() => setView("settings")}
                activeView={view}
            />

            {view === "settings" ? (
                <Settings
                    inboxes={inboxes}
                    onCreateInbox={handleCreateInbox}
                    onDeleteInbox={handleDeleteInbox}
                    onBack={() => setView("mail")}
                />
            ) : (
                <>
                    <EmailList
                        emails={emails}
                        total={total}
                        search={search}
                        onSearch={setSearch}
                        selectedId={selectedEmail?.id}
                        onSelectEmail={handleSelectEmail}
                        onDeleteEmail={handleDeleteEmail}
                        onClearInbox={handleClearInbox}
                        loading={loading}
                        inboxName={selectedInbox?.name ?? "Inbox"}
                    />
                    <EmailViewer email={selectedEmail} />
                </>
            )}
        </div>
    );
}

function matchesSearch(email: Email, q: string): boolean {
    const lq = q.toLowerCase();
    return (
        email.subject.toLowerCase().includes(lq) ||
        email.from.toLowerCase().includes(lq) ||
        email.to.some((t) => t.toLowerCase().includes(lq)) ||
        (email.text?.toLowerCase().includes(lq) ?? false)
    );
}

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
