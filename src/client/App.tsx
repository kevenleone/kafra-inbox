import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useMatch, useNavigate, useParams } from "react-router-dom";

import type { Email, Inbox, WsMessage } from "../shared/types";
import { EmailList } from "./components/email/list";
import { EmailViewer } from "./components/email/viewer";
import { Settings } from "./components/ui/settings";
import { Sidebar } from "./components/ui/sidebar";

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
    const navigate = useNavigate();
    const { inboxId, emailId } = useParams<{
        inboxId?: string;
        emailId?: string;
    }>();
    const isSettings = !!useMatch("/settings");

    const selectedInboxId = inboxId ?? "default";

    const [connected, setConnected] = useState(false);
    const [emails, setEmails] = useState<Email[]>([]);
    const [inboxes, setInboxes] = useState<Inbox[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [total, setTotal] = useState(0);

    const emailIdRef = useRef(emailId);
    const navigateRef = useRef(navigate);
    const searchRef = useRef(search);
    const selectedInboxIdRef = useRef(selectedInboxId);
    // Tracks last inbox visited so settings "back" returns to the right place
    const prevInboxIdRef = useRef(selectedInboxId);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        emailIdRef.current = emailId;
    }, [emailId]);

    useEffect(() => {
        navigateRef.current = navigate;
    }, [navigate]);

    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    useEffect(() => {
        selectedInboxIdRef.current = selectedInboxId;
        if (!isSettings) prevInboxIdRef.current = selectedInboxId;
    }, [selectedInboxId, isSettings]);

    // ── Browser tab title with unread count ───────────────────────────────────
    useEffect(() => {
        const totalUnread = inboxes.reduce(
            (sum, inbox) => sum + inbox.unreadCount,
            0,
        );
        document.title =
            totalUnread > 0
                ? `(${totalUnread}) KafraInbox — Email Sandbox`
                : "KafraInbox — Email Sandbox";
    }, [inboxes]);

    // ── WebSocket ─────────────────────────────────────────────────────────────
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

                    if (emailIdRef.current === msg.id) {
                        navigateRef.current(
                            `/${selectedInboxIdRef.current}`,
                            { replace: true },
                        );
                    }
                } else if (msg.type === "inbox_cleared") {
                    if (msg.inboxId === selectedInboxIdRef.current) {
                        setEmails([]);
                        setTotal(0);

                        if (emailIdRef.current) {
                            navigateRef.current(
                                `/${selectedInboxIdRef.current}`,
                                { replace: true },
                            );
                        }
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

    // ── Fetch email from URL param ────────────────────────────────────────────
    useEffect(() => {
        if (!emailId) {
            return setSelectedEmail(null);
        }

        fetch(`/api/emails/${emailId}`)
            .then((response) => response.json() as Promise<Email>)
            .then((fullEmail) => {
                setSelectedEmail(fullEmail);

                setEmails((prev) => {
                    const wasUnread =
                        prev.find((e) => e.id === emailId)?.isRead === false;

                    if (wasUnread) {
                        setInboxes((inboxes) =>
                            inboxes.map((inbox) =>
                                inbox.id === fullEmail.inboxId
                                    ? {
                                          ...inbox,
                                          unreadCount: Math.max(
                                              0,
                                              inbox.unreadCount - 1,
                                          ),
                                      }
                                    : inbox,
                            ),
                        );
                    }

                    return prev.map((e) =>
                        e.id === emailId ? { ...e, isRead: true } : e,
                    );
                });
            })
            .catch(console.error);
    }, [emailId]);

    const handleSelectEmail = useCallback(
        (email: Email) => {
            navigate(`/${email.inboxId}/${email.id}`);
        },
        [navigate],
    );

    const handleDeleteEmail = useCallback(
        async (id: string) => {
            await fetch(`/api/emails/${id}`, { method: "DELETE" });
            setEmails((prev) => prev.filter((e) => e.id !== id));
            setTotal((t) => Math.max(0, t - 1));
            if (emailId === id) {
                navigate(`/${selectedInboxId}`, { replace: true });
            }
        },
        [emailId, selectedInboxId, navigate],
    );

    const handleClearInbox = useCallback(async () => {
        await fetch(`/api/emails?inboxId=${selectedInboxId}`, {
            method: "DELETE",
        });

        setEmails([]);
        setTotal(0);

        if (emailId) {
            navigate(`/${selectedInboxId}`, { replace: true });
        }

        setInboxes((prevInboxes) =>
            prevInboxes.map((inbox) =>
                inbox.id === selectedInboxId
                    ? { ...inbox, emailCount: 0, unreadCount: 0 }
                    : inbox,
            ),
        );
    }, [selectedInboxId, emailId, navigate]);

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
                navigate("/default", { replace: true });
            }
        },
        [selectedInboxId, navigate],
    );

    const selectedInbox = inboxes.find((i) => i.id === selectedInboxId);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar
                activeView={isSettings ? "settings" : "mail"}
                connected={connected}
                inboxes={inboxes}
                selectedInboxId={selectedInboxId}
                onOpenSettings={() => navigate("/settings")}
                onSelectInbox={(id) => navigate(`/${id}`)}
            />

            {isSettings ? (
                <Settings
                    inboxes={inboxes}
                    onBack={() => navigate(`/${prevInboxIdRef.current}`)}
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
                        selectedId={emailId}
                        total={total}
                    />

                    <EmailViewer email={selectedEmail} />
                </>
            )}

            <Outlet />
        </div>
    );
}
