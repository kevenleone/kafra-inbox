# KafraInbox

A local email sandbox for development — captures outgoing emails from your apps without sending them, similar to Mailtrap.

<p align="center">
    <img style="border-radius: 5px" src="./assets/kafrainbox.png" width="250"  />
</p>

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

All options are configurable via environment variables:

| Variable                               | Default | Description                                      |
| -------------------------------------- | ------- | ------------------------------------------------ |
| `KAFRAINBOX_HTTP_SERVER_PORT`          | `3134`  | HTTP server port                                 |
| `KAFRAINBOX_SMTP_SERVER_PORT`          | `1025`  | SMTP server port                                 |
| `KAFRAINBOX_DEFAULT_INBOX_USERNAME`    | —       | Default inbox SMTP username                      |
| `KAFRAINBOX_DEFAULT_INBOX_PASSWORD`    | —       | Default inbox SMTP password                      |
| `KAFRAINBOX_SMTP_SERVER_AUTH_OPTIONAL` | `false` | Allow unauthenticated SMTP connections           |
| `KAFRAINBOX_SMTP_SERVER_AUTH_SECURE`   | `false` | Require secure (TLS) SMTP auth                   |
| `KAFRAINBOX_SMTP_SERVER_LOGGER`        | `false` | Enable SMTP server logging                       |
| `KAFRAINBOX_DANGEROUSLY_NO_AUTH`       | `false` | Disable all authentication (development use only)|

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
