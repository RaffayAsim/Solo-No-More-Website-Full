import "server-only";

/**
 * Server-only transactional email.
 *
 * Sends through any SMTP mailbox (Gmail with an App Password by default). Configure:
 *   SMTP_USER   the mailbox address, e.g. hello@yourdomain.com or you@gmail.com
 *   SMTP_PASS   the mailbox App Password (Gmail: Google Account → Security → App passwords)
 *   SMTP_HOST   optional, default smtp.gmail.com
 *   SMTP_PORT   optional, default 465
 *   EMAIL_FROM_NAME   optional, default "Solo-No-More"
 *   EMAIL_REPLY_TO    optional
 *   ADMIN_NOTIFY_EMAIL optional — where "new application / new payment proof" alerts go
 *
 * Email is best-effort: a failure is logged and reported to the caller as `false`,
 * but it never breaks the action that triggered it.
 */
import { PAYMENT_CONFIG, bankAccountRows, formatWhatsAppNumber } from "@/lib/payment-config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let cachedTransport: any = null;

async function getTransport(): Promise<any | null> {
  if (!isEmailConfigured()) return null;
  if (cachedTransport) return cachedTransport;
  const nodemailer: any = await import("nodemailer");
  const createTransport = nodemailer.createTransport || nodemailer.default?.createTransport;
  const port = Number(process.env.SMTP_PORT) || 465;
  cachedTransport = createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
  return cachedTransport;
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailContent {
  to: string;
  subject: string;
  /** Large heading inside the email. */
  heading: string;
  /** Paragraphs of plain text (escaped automatically). */
  paragraphs: string[];
  /** Optional label/value rows shown in a boxed table (e.g. bank details). */
  details?: { label: string; value: string }[];
  /** Optional call-to-action button. */
  button?: { label: string; url: string };
  /** Small print under the button. */
  footnote?: string;
}

function renderHtml(c: EmailContent): string {
  const paragraphs = c.paragraphs
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#333333;">${escapeHtml(p)}</p>`)
    .join("");
  const details = c.details?.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 18px;border:1px solid #eeeeee;border-radius:10px;background:#fafafa;">${c.details
        .map(
          (d) =>
            `<tr><td style="padding:10px 14px;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;border-bottom:1px solid #f0f0f0;">${escapeHtml(
              d.label
            )}</td><td style="padding:10px 14px;font-size:14px;font-weight:bold;color:#111111;border-bottom:1px solid #f0f0f0;font-family:Menlo,Consolas,monospace;">${escapeHtml(
              d.value
            )}</td></tr>`
        )
        .join("")}</table>`
    : "";
  const button = c.button
    ? `<p style="margin:8px 0 18px;"><a href="${escapeHtml(c.button.url)}" style="display:inline-block;background:#FF5A1F;color:#ffffff;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 26px;border-radius:10px;">${escapeHtml(
        c.button.label
      )}</a></p><p style="margin:0 0 14px;font-size:12px;line-height:1.5;color:#888888;word-break:break-all;">If the button does not work, copy this link into your browser:<br>${escapeHtml(
        c.button.url
      )}</p>`
    : "";
  const footnote = c.footnote
    ? `<p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#666666;">${escapeHtml(c.footnote)}</p>`
    : "";

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;">
<tr><td style="background:#111111;padding:18px 24px;font-size:18px;font-weight:bold;color:#ffffff;">Solo<span style="color:#FF5A1F;">-No-</span>More</td></tr>
<tr><td style="padding:26px 24px 10px;">
<h1 style="margin:0 0 16px;font-size:21px;line-height:1.3;color:#111111;">${escapeHtml(c.heading)}</h1>
${paragraphs}${details}${button}${footnote}
</td></tr>
<tr><td style="padding:14px 24px 22px;font-size:12px;line-height:1.5;color:#999999;border-top:1px solid #f0f0f0;">You are receiving this email because of your activity on Solo-No-More. If this was not you, you can ignore it.</td></tr>
</table></td></tr></table></body></html>`;
}

function renderText(c: EmailContent): string {
  const lines = [c.heading, "", ...c.paragraphs.flatMap((p) => [p, ""])];
  if (c.details?.length) {
    for (const d of c.details) lines.push(`${d.label}: ${d.value}`);
    lines.push("");
  }
  if (c.button) lines.push(`${c.button.label}: ${c.button.url}`, "");
  if (c.footnote) lines.push(c.footnote);
  return lines.join("\n");
}

/** Connection-level SMTP failures worth one retry (not recipient/content rejections). */
function isTransientSmtpError(err: any): boolean {
  if (!err) return false;
  if (typeof err.responseCode === "number" && err.responseCode >= 500) return false; // permanent rejection
  if (err.code === "EENVELOPE" || err.code === "EMESSAGE" || err.code === "EAUTH") return false;
  const codes = ["ETIMEDOUT", "ECONNECTION", "ESOCKET", "ECONNRESET", "ECONNREFUSED", "EDNS", "EPIPE", "ETLS"];
  return codes.includes(err.code) || /timeout|timed out|greeting never received|connection closed/i.test(String(err.message || ""));
}

/** Sends one email (one retry on connection/timeout errors). Resolves to true when the mail server accepted it. */
export async function sendEmail(content: EmailContent): Promise<boolean> {
  const to = (content.to || "").trim();
  if (!EMAIL_PATTERN.test(to)) return false;

  try {
    const transport = await getTransport();
    if (!transport) {
      console.warn(`[email] SMTP not configured — skipped "${content.subject}"`);
      return false;
    }
    const fromName = (process.env.EMAIL_FROM_NAME || "Solo-No-More").replace(/["<>\r\n]/g, "");
    const message = {
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      subject: content.subject.replace(/[\r\n]/g, " ").slice(0, 200),
      text: renderText(content),
      html: renderHtml(content),
    };
    try {
      await transport.sendMail(message);
    } catch (err: any) {
      // Retry once, on a fresh connection, only for connection/timeout problems —
      // never when the server rejected the recipient or the message.
      if (!isTransientSmtpError(err)) throw err;
      console.warn(`[email] Retrying "${content.subject}" after: ${err?.message || err}`);
      cachedTransport = null;
      const retryTransport = await getTransport();
      await retryTransport.sendMail(message);
    }
    // Send log for scripts/e2e (off unless E2E_EMAIL_LOG=1). Logs subject + recipient domain only.
    if (process.env.E2E_EMAIL_LOG === "1") console.log(`[e2e-email] sent "${content.subject}" to @${to.split("@")[1]}`);
    return true;
  } catch (err: any) {
    console.error(`[email] Failed to send "${content.subject}":`, err?.message || err);
    return false;
  }
}

/** Valid addresses from ADMIN_NOTIFY_EMAIL (comma-separated). Invalid entries are skipped. */
export function getAdminNotifyEmails(): string[] {
  const list = (process.env.ADMIN_NOTIFY_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EMAIL_PATTERN.test(s));
  return [...new Set(list)];
}

/** Alert for the team inbox (new application, new payment proof). True if at least one address accepted it. */
export async function notifyAdminByEmail(subject: string, paragraphs: string[], button?: { label: string; url: string }) {
  const recipients = getAdminNotifyEmails();
  if (!recipients.length) return false;
  const results = await Promise.all(
    recipients.map((to) => sendEmail({ to, subject: `[Solo-No-More] ${subject}`, heading: subject, paragraphs, button }))
  );
  return results.some(Boolean);
}

/** The bank account rows used in payment emails — same source as the payment screens. */
export function bankDetailRows(amountPkr: number, reference?: string): { label: string; value: string }[] {
  const rows = [
    { label: "Amount", value: `PKR ${Number(amountPkr || 0).toLocaleString("en-US")}` },
    ...bankAccountRows(),
  ];
  if (reference) rows.push({ label: "Your reference", value: reference });
  rows.push({ label: "WhatsApp", value: formatWhatsAppNumber(PAYMENT_CONFIG.whatsappNumber) });
  return rows;
}
