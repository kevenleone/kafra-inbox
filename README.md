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

## Environment Variables

| Variable                               | Default | Description                                         |
| -------------------------------------- | ------- | --------------------------------------------------- |
| `KAFRAINBOX_HTTP_SERVER_PORT`          | `3134`  | HTTP server port                                    |
| `KAFRAINBOX_SMTP_SERVER_PORT`          | `1025`  | SMTP server port                                    |
| `KAFRAINBOX_DEFAULT_INBOX_USERNAME`    | —       | Default inbox SMTP username                         |
| `KAFRAINBOX_DEFAULT_INBOX_PASSWORD`    | —       | Default inbox SMTP password                         |
| `KAFRAINBOX_SMTP_SERVER_AUTH_OPTIONAL` | `false` | Allow unauthenticated SMTP connections              |
| `KAFRAINBOX_SMTP_SERVER_AUTH_SECURE`   | `false` | Require secure (TLS) SMTP auth                      |
| `KAFRAINBOX_SMTP_SERVER_LOGGER`        | `false` | Enable verbose SMTP logging                         |
| `KAFRAINBOX_DANGEROUSLY_NO_AUTH`       | `false` | Disable all authentication (dev only)               |
| `KAFRAINBOX_NTFY_URL`                  | —       | ntfy topic URL for push notifications on new email  |
| `KAFRAINBOX_NTFY_TOKEN`                | —       | Bearer token for private ntfy topics                |
| `KAFRAINBOX_NTFY_PRESET`               | `full`  | Notification body format: `short`, `full`, or `dev` |

### ntfy integration

When `KAFRAINBOX_NTFY_URL` is set, a push notification is sent to your [ntfy](https://ntfy.sh) topic whenever a new email arrives. Three presets control the message body:

| Preset  | Content                                                                                      |
| ------- | -------------------------------------------------------------------------------------------- |
| `short` | Single line: `sender → recipient [Inbox]`                                                    |
| `full`  | From / To / CC / Inbox / Size + text preview + attachment names                              |
| `dev`   | Everything in `full` plus BCC, email ID, timestamp, and per-attachment size and content-type |

## Scripts

| Command        | Description                       |
| -------------- | --------------------------------- |
| `bun dev`      | Start with hot-reload (`--watch`) |
| `bun start`    | Start without hot-reload          |
| `bun build`    | Bundle frontend to `dist/`        |
| `bun lint`     | Run oxlint                        |
| `bun lint:fix` | Run oxlint with auto-fix          |

## Testing

Send a test email to verify everything works:

```bash
bun test-email.ts
```

## Features

- **SMTP capture** — accepts all mail on the configured port
- **Real-time updates** — new emails appear instantly via WebSocket
- **Email viewer** — HTML (sandboxed iframe), Text, Raw MIME, and Headers tabs
- **Attachments** — listed with download support; inline CID images resolved
- **Multiple inboxes** — create/delete inboxes with per-inbox SMTP credentials
- **URL-driven navigation** — inbox and selected email are reflected in the URL (`/:inboxId/:emailId`)
- **Unread tracking** — unread count shown in the sidebar and browser tab title
- **Keyboard navigation** — previous/next email buttons in the list header
- **Search** — filter by subject, sender, recipient, or body
- **Error simulation** — rules to reject recipients or introduce delivery delays
- **Push notifications** — optional ntfy integration with configurable message presets
- **SQLite persistence** — emails and inboxes survive server restarts

# Docker with Docker

```bash
docker run -d \
  -p 3134:3134 \
  -p 1025:1025 \
  -v kafra-data:/app/database \
  -e KAFRAINBOX_DEFAULT_INBOX_USERNAME=admin \
  -e KAFRAINBOX_DEFAULT_INBOX_PASSWORD=secret \
  --name kafrainbox \
  kevenleone/kafrainbox:latest
```

Then open http://localhost:3134 and point your mailer at `localhost:1025`.
