export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: string; // base64 encoded
  cid?: string;
}

export interface Email {
  id: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text?: string;
  html?: string;
  raw: string;
  headers: Record<string, string>;
  attachments: Attachment[];
  size: number;
  timestamp: string;
  inboxId: string;
  isRead: boolean;
}

export interface SmtpConfig {
  port: number;
  username?: string;
  password?: string;
}

export interface Inbox {
  id: string;
  name: string;
  emailCount: number;
  unreadCount: number;
  createdAt: string;
  smtp: SmtpConfig;
}

export interface SmtpRule {
  id: string;
  type: "reject" | "delay";
  pattern: string; // regex for matching recipient emails
  errorCode?: number; // SMTP error code (e.g. 550, 421)
  delayMs?: number; // delay in milliseconds
  description?: string;
}

export interface PaginatedEmails {
  data: Email[];
  total: number;
  page: number;
  pageSize: number;
}

export type WsMessage =
  | { type: "connected" }
  | { type: "new_email"; email: Email }
  | { type: "email_deleted"; id: string }
  | { type: "inbox_cleared"; inboxId: string };
