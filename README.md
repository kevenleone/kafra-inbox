# Mail4All

A local email sandbox for testing — captures outgoing emails from your apps without sending them, similar to Mailtrap.

## Quick Start

```bash
bun install
bun dev
```

Open **http://localhost:3000** in your browser.

## SMTP Configuration

Point your app's mailer at:

```
host:     localhost
port:     1025
username: (none)
password: (none)
security: none / STARTTLS disabled
```

## Testing

Send a test email to verify everything works:

```bash
bun test-email.ts
```

## Scripts

| Command     | Description                      |
| ----------- | -------------------------------- |
| `bun dev`   | Start API + SMTP with hot-reload |
| `bun start` | Start without hot-reload         |
| `bun build` | Bundle frontend to `dist/`       |

## Project Structure

```
mail4all/
├── server/
│   ├── index.ts      # Bun HTTP + WebSocket server (port 3000)
│   ├── smtp.ts       # SMTP server (port 1025) — captures emails
│   └── storage.ts    # In-memory storage (swap for SQLite later)
├── client/
│   ├── index.html    # HTML entry point
│   ├── App.tsx       # Main React app
│   └── components/
│       ├── Sidebar.tsx      # Inbox list + SMTP config panel
│       ├── EmailList.tsx    # Searchable email list
│       └── EmailViewer.tsx  # Email detail with HTML/Text/Raw/Headers tabs
├── shared/
│   └── types.ts      # Shared TypeScript types
└── test-email.ts     # Send a test email via raw SMTP
```

## Features

- **SMTP capture** — accepts all mail on port 1025, no auth required
- **Real-time updates** — new emails appear instantly via WebSocket
- **Email viewer** — HTML (sandboxed iframe), Text, Raw MIME, Headers tabs
- **Attachments** — listed with download support; inline CID images resolved
- **Multiple inboxes** — create/delete additional inboxes
- **Search** — filter by subject, sender, recipient, or body
- **Error simulation** — add rules to reject recipients or add delays
- **Copy SMTP config** — one-click copy of SMTP settings

## Replacing In-Memory Storage with SQLite

`server/storage.ts` exports an `IStorage` interface. To swap in SQLite:

1. Create `server/sqlite-storage.ts` implementing `IStorage` using `bun:sqlite`
2. Replace the `export const storage = new MemoryStorage()` line with your new class
