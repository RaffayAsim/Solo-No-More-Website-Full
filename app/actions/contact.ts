"use server";

import { getAdminNotifyEmails, isEmailConfigured, sendEmail } from "@/lib/server/email";
import { isValidEmail } from "@/lib/server/auth-users";

/**
 * Server Action: deliver a contact-form message to the team inbox
 * (ADMIN_NOTIFY_EMAIL, or the sending mailbox itself when that is not set).
 */
export async function submitContactMessageAction(input: {
  topic?: string;
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const name = (input.name || "").trim().slice(0, 120);
  const email = (input.email || "").trim().toLowerCase().slice(0, 200);
  const message = (input.message || "").trim().slice(0, 4000);
  const topic = (input.topic || "general").trim().slice(0, 60);

  if (!name || !message) return { success: false, error: "Please fill in your name and message." };
  if (!isValidEmail(email)) return { success: false, error: "Please enter a valid email address." };

  const adminList = getAdminNotifyEmails();
  const fallback = (process.env.SMTP_USER || "").trim();
  const inboxes = adminList.length ? adminList : fallback ? [fallback] : [];
  if (!isEmailConfigured() || !inboxes.length) {
    return {
      success: false,
      error: "Our contact form is temporarily unavailable. Please email us directly instead.",
    };
  }

  const results = await Promise.all(inboxes.map((to) => sendEmail({
    to,
    subject: `[Contact] ${topic} — ${name}`,
    heading: "New message from the contact form",
    paragraphs: message.split(/\n{2,}/).slice(0, 30),
    details: [
      { label: "Name", value: name },
      { label: "Email", value: email },
      { label: "Topic", value: topic },
    ],
    footnote: `Reply directly to ${email}.`,
  })));
  const sent = results.some(Boolean);

  return sent
    ? { success: true }
    : { success: false, error: "Your message could not be sent. Please try again or email us directly." };
}
