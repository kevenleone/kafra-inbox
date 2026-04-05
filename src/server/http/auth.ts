import { randomBytes } from "node:crypto";

import { storage } from "../persistence/storage";
import { environment } from "../utils/environment";

const SESSION_COOKIE = "kafra_session";

const sessions = new Map<string, { username: string }>();

function generateToken(): string {
    return randomBytes(32).toString("hex");
}

function parseCookies(cookieHeader: string): Record<string, string> {
    return Object.fromEntries(
        cookieHeader
            .split(";")
            .map((c) => c.trim().split("="))
            .filter((parts) => parts.length === 2)
            .map(([k, v]) => [k!.trim(), v!.trim()]),
    );
}

export function getSession(req: Request): { username: string } | null {
    if (environment.KAFRAINBOX_DANGEROUSLY_NO_AUTH) {
        return { username: "anonymous" };
    }

    const cookies = parseCookies(req.headers.get("cookie") ?? "");
    const token = cookies[SESSION_COOKIE];
    if (!token) return null;

    return sessions.get(token) ?? null;
}

function makeSessionCookie(token: string): string {
    return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/`;
}

function clearSessionCookie(): string {
    return `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export const authStatusHandler = {
    GET(req: Request) {
        const session = getSession(req);
        const authenticated =
            environment.KAFRAINBOX_DANGEROUSLY_NO_AUTH || !!session;
        // Setup is never required when auth is disabled entirely.
        const setupRequired =
            !environment.KAFRAINBOX_DANGEROUSLY_NO_AUTH && !storage.hasUsers();

        return Response.json({
            authenticated,
            setupRequired,
            username: authenticated ? (session?.username ?? null) : null,
        });
    },
};

export const authSetupHandler = {
    async POST(req: Request) {
        if (storage.hasUsers()) {
            return Response.json(
                { error: "Setup already completed" },
                { status: 400 },
            );
        }

        const body = (await req.json()) as {
            username?: string;
            password?: string;
        };

        const username = body.username?.trim();
        const password = body.password;

        if (!username || !password) {
            return Response.json(
                { error: "Username and password are required" },
                { status: 400 },
            );
        }

        if (username.length < 3) {
            return Response.json(
                { error: "Username must be at least 3 characters" },
                { status: 400 },
            );
        }

        if (password.length < 6) {
            return Response.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 },
            );
        }

        const passwordHash = await Bun.password.hash(password);
        storage.createUser(username, passwordHash);

        const token = generateToken();
        sessions.set(token, { username });

        return new Response(JSON.stringify({ username }), {
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": makeSessionCookie(token),
            },
            status: 201,
        });
    },
};

export const authLoginHandler = {
    async POST(req: Request) {
        const body = (await req.json()) as {
            username?: string;
            password?: string;
        };

        const username = body.username?.trim();
        const password = body.password;

        if (!username || !password) {
            return Response.json(
                { error: "Username and password are required" },
                { status: 400 },
            );
        }

        const user = storage.getUserByUsername(username);

        if (
            !user ||
            !(await Bun.password.verify(password, user.passwordHash))
        ) {
            return Response.json(
                { error: "Invalid username or password" },
                { status: 401 },
            );
        }

        const token = generateToken();
        sessions.set(token, { username });

        return new Response(JSON.stringify({ username }), {
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": makeSessionCookie(token),
            },
        });
    },
};

export const authLogoutHandler = {
    POST(req: Request) {
        const cookies = parseCookies(req.headers.get("cookie") ?? "");
        const token = cookies[SESSION_COOKIE];

        if (token) {
            sessions.delete(token);
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": clearSessionCookie(),
            },
        });
    },
};

// Wraps a route handler object so every method requires a valid session.
// Uses `any` for the request parameter to accommodate BunRequest<T> variants.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuth<T extends Record<string, (req: any) => any>>(
    handler: T,
): T {
    if (environment.KAFRAINBOX_DANGEROUSLY_NO_AUTH) return handler;

    return Object.fromEntries(
        Object.entries(handler).map(([method, fn]) => [
            method,
            (req: Request) => {
                const session = getSession(req);
                if (!session) {
                    return Response.json(
                        { error: "Unauthorized" },
                        { status: 401 },
                    );
                }
                return fn(req);
            },
        ]),
    ) as T;
}
