import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

type Status = "loading" | "authenticated" | "guest";

export function GuestOnly({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<Status>("loading");

    useEffect(() => {
        fetch("/api/auth/status")
            .then(
                (res) =>
                    res.json() as Promise<{
                        authenticated: boolean;
                        setupRequired: boolean;
                    }>,
            )
            .then(({ authenticated, setupRequired }) => {
                if (authenticated && !setupRequired) setStatus("authenticated");
                else setStatus("guest");
            })
            .catch(() => setStatus("guest"));
    }, []);

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-sm text-gray-400">Loading…</div>
            </div>
        );
    }

    if (status === "authenticated") return <Navigate to="/" replace />;

    return <>{children}</>;
}
