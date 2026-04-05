import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext, useSignOut } from "../context/auth";

type AuthStatus = "loading" | "setup" | "unauthenticated" | "ok";

export function RequireAuth({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading");
    const [username, setUsername] = useState("");
    const signOut = useSignOut();

    useEffect(() => {
        fetch("/api/auth/status")
            .then(
                (res) =>
                    res.json() as Promise<{
                        authenticated: boolean;
                        setupRequired: boolean;
                        username: string | null;
                    }>,
            )
            .then(({ authenticated, setupRequired, username }) => {
                if (setupRequired) setStatus("setup");
                else if (!authenticated) setStatus("unauthenticated");
                else {
                    setUsername(username ?? "");
                    setStatus("ok");
                }
            })
            .catch(() => setStatus("unauthenticated"));
    }, []);

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-sm text-gray-400">Loading…</div>
            </div>
        );
    }

    if (status === "setup") return <Navigate to="/setup" replace />;
    if (status === "unauthenticated") return <Navigate to="/login" replace />;

    return (
        <AuthContext.Provider value={{ username, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
