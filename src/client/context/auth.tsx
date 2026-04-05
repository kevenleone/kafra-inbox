import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";

interface AuthContextValue {
    username: string;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within RequireAuth");
    return ctx;
}

export function useSignOut() {
    const navigate = useNavigate();

    return async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        navigate("/login", { replace: true });
    };
}
