import { Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Onboarding() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/setup", {
                body: JSON.stringify({ username, password }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });

            const data = (await res.json()) as { username?: string; error?: string };

            if (!res.ok) {
                setError(data.error ?? "Setup failed");
                return;
            }

            navigate("/", { replace: true });
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                        <Mail className="w-8 h-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-800">
                            Kafra Inbox
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <h1 className="text-xl font-semibold text-gray-900 mb-1">
                        Welcome! Let's get started
                    </h1>
                    <p className="text-sm text-gray-500 mb-6">
                        Create an admin account to secure your inbox.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                autoFocus
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                                type="text"
                                value={username}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                required
                                type="password"
                                value={password}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm password
                            </label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder="Repeat your password"
                                required
                                type="password"
                                value={confirmPassword}
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}

                        <button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
                            disabled={loading}
                            type="submit"
                        >
                            {loading ? "Creating account…" : "Create account"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
