# KafraInbox

A local email sandbox for development — captures outgoing emails from your apps without sending them, similar to Mailtrap.

## Quick Start

```bash
bun install
bun dev
```

Open **http://localhost:3134** in your browser.

## SMTP Configuration

Point your app's mailer at:

```
host:     localhost
port:     1025
username: (none)
password: (none)
security: none / STARTTLS disabled
```

Both ports are configurable via environment variables:

| Variable               | Default |
| ---------------------- | ------- |
| `KAFRAINBOX_HTTP_PORT` | `3134`  |
| `KAFRAINBOX_SMTP_PORT` | `1025`  |

## Testing

Send a test email to verify everything works:

```bash
bun test-email.ts
```

## Scripts

| Command     | Description                     |
| ----------- | ------------------------------- |
| `bun dev`   | Start with hot-reload (`--hot`) |
| `bun start` | Start without hot-reload        |
| `bun build` | Bundle frontend to `dist/`      |

## Project Structure

```
src/
├── client/
│   ├── index.html              # HTML entry point
│   ├── index.css               # Global styles
│   ├── App.tsx                 # Main React app
│   └── components/
│       ├── EmailList.tsx       # Searchable email list
│       ├── EmailViewer.tsx     # Email detail (HTML/Text/Raw/Headers tabs)
│       ├── Settings.tsx        # App settings panel
│       └── Sidebar.tsx         # Inbox list + SMTP config panel
├── server/
│   ├── index.ts                # Bun HTTP + WebSocket server
│   ├── types.ts                # Server-side TypeScript types
│   ├── http/
│   │   ├── emails.ts           # GET /api/emails, DELETE /api/emails
│   │   ├── email.ts            # /api/emails/:id routes
│   │   ├── inboxes.ts          # /api/inboxes routes
│   │   └── rules.ts            # /api/rules routes
│   ├── persistence/
│   │   └── storage.ts          # SQLite storage (bun:sqlite)
│   ├── smtp/
│   │   ├── index.ts            # SMTP server lifecycle
│   │   └── smtp-server.ts      # SMTP server creation + email parsing
│   └── utils/
│       ├── environment.ts      # Validated env vars (valibot)
│       └── index.ts            # Shared utilities
└── shared/
    └── types.ts                # Types shared between client and server
```

## Features

- **SMTP capture** — accepts all mail on the configured port, no auth required
- **Real-time updates** — new emails appear instantly via WebSocket
- **Email viewer** — HTML (sandboxed iframe), Text, Raw MIME, Headers tabs
- **Attachments** — listed with download support; inline CID images resolved
- **Multiple inboxes** — create/delete additional inboxes with per-inbox SMTP credentials
- **Search** — filter by subject, sender, recipient, or body
- **Error simulation** — add rules to reject recipients or introduce delays
- **SQLite persistence** — emails and inboxes survive server restarts
- **Configurable ports** — HTTP and SMTP ports set via environment variables
