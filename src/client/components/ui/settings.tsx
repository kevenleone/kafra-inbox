import {
    AlertCircle,
    ArrowLeft,
    Check,
    Copy,
    Mail,
    Plus,
    Trash2,
} from "lucide-react";
import React, { useState } from "react";
import type { Inbox, SmtpConfig } from "../../../shared/types";

interface SettingsProps {
    inboxes: Inbox[];
    onBack: () => void;
    onCreateInbox: (name: string) => Promise<{ error?: string }>;
    onDeleteInbox: (id: string) => void;
}

interface InboxFormState {
    name: string;
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
        >
            {copied ? (
                <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-600">Copied</span>
                </>
            ) : (
                <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                </>
            )}
        </button>
    );
}

function SmtpConfigBlock({ smtp }: { smtp: SmtpConfig }) {
    const configText = [
        `host: localhost`,
        `port: ${smtp.port}`,
        smtp.username ? `username: ${smtp.username}` : `username: (none)`,
        smtp.password ? `password: ${smtp.password}` : `password: (none)`,
    ].join("\n");

    return (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SMTP Config
                </span>
                <CopyButton text={configText} />
            </div>
            <div className="space-y-1 font-mono text-xs text-gray-600">
                <div className="flex gap-3">
                    <span className="text-gray-400 w-20">host</span>
                    <span>localhost</span>
                </div>
                <div className="flex gap-3">
                    <span className="text-gray-400 w-20">port</span>
                    <span className="text-blue-600 font-semibold">
                        {smtp.port}
                    </span>
                </div>
                <div className="flex gap-3">
                    <span className="text-gray-400 w-20">username</span>
                    <span>
                        {smtp.username || (
                            <span className="text-gray-400 italic">none</span>
                        )}
                    </span>
                </div>
                <div className="flex gap-3">
                    <span className="text-gray-400 w-20">password</span>
                    <span>
                        {smtp.password || (
                            <span className="text-gray-400 italic">none</span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

function InboxCard({
    inbox,
    onDelete,
}: {
    inbox: Inbox;
    onDelete: () => void;
}) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-slate-800">
                                {inbox.name}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {inbox.emailCount} email
                                {inbox.emailCount !== 1 ? "s" : ""}
                                {inbox.unreadCount > 0 &&
                                    ` · ${inbox.unreadCount} unread`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {inbox.id !== "default" && !confirmDelete && (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    )}
                    {confirmDelete && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs text-red-600">Sure?</span>
                            <button
                                onClick={onDelete}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                                Yes, delete
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <SmtpConfigBlock smtp={inbox.smtp} />
        </div>
    );
}

function NewInboxForm({
    onSubmit,
    onCancel,
}: {
    onSubmit: (name: string) => Promise<{ error?: string }>;
    onCancel: () => void;
}) {
    const [form, setForm] = useState<InboxFormState>({
        name: "",
    });

    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError("Name is required");
            return;
        }

        setSaving(true);
        setError("");
        const result = await onSubmit(form.name.trim());
        setSaving(false);
        if (result.error) setError(result.error);
    };

    return (
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center">
                    <Plus className="w-3 h-3 text-white" />
                </div>
                New Inbox
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                        Inbox Name
                    </label>
                    <input
                        autoFocus
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                            setForm((f) => ({ ...f, name: e.target.value }))
                        }
                        placeholder="e.g. My Project"
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        required
                    />
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                    SMTP credentials are generated automatically after creation.
                    Port stays fixed at 1025.
                </div>

                {error && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {error}
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="submit"
                        disabled={saving}
                        className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        {saving ? "Creating…" : "Create inbox"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export function Settings({
    inboxes,
    onCreateInbox,
    onDeleteInbox,
    onBack,
}: SettingsProps) {
    const [addingNew, setAddingNew] = useState(false);

    const handleCreate = async (name: string) => {
        const result = await onCreateInbox(name);
        if (!result.error) setAddingNew(false);
        return result;
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold text-slate-900">
                            Settings
                        </h1>
                        <p className="text-xs text-gray-400">
                            Manage inboxes and SMTP configuration
                        </p>
                    </div>
                </div>
                {!addingNew && (
                    <button
                        onClick={() => setAddingNew(true)}
                        className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Inbox
                    </button>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-2xl space-y-4">
                    {/* New inbox form */}
                    {addingNew && (
                        <NewInboxForm
                            onSubmit={handleCreate}
                            onCancel={() => setAddingNew(false)}
                        />
                    )}

                    {/* Existing inboxes */}
                    {inboxes.map((inbox) => (
                        <InboxCard
                            key={inbox.id}
                            inbox={inbox}
                            onDelete={() => onDeleteInbox(inbox.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
