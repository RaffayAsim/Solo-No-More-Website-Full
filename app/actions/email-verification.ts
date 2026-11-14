"use server";

import { sendEmail } from "@/lib/server/email";
import { checkEmail } from "@/lib/signup-validation";
import {
  canSendCodeNow,
  emailDomainAcceptsMail,
  issueEmailChallenge,
  redeemEmailChallenge,
} from "@/lib/server/email-verification";

/** Step 1: email a 6-digit code. Returns a signed challenge the browser sends back with the code. */
export async function sendEmailCodeAction(
  email: string
): Promise<{ success: true; challenge: string } | { success: false; error: string }> {
  const v = String(email || "").trim().toLowerCase();
  const formatError = checkEmail(v);
  if (formatError) return { success: false, error: formatError };
  if (!(await emailDomainAcceptsMail(v))) {
    return { success: false, error: "This email address cannot receive mail. Please check the spelling." };
  }
  if (!canSendCodeNow(v)) return { success: false, error: "A code was just sent. Please wait a minute before asking again." };

  const { code, challenge } = issueEmailChallenge(v);
  const sent = await sendEmail({
    to: v,
    subject: `${code} is your Solo-No-More verification code`,
    heading: "Confirm your email",
    paragraphs: [
      "Use this code to confirm your email address on Solo-No-More:",
      code,
      "It expires in 15 minutes. If you did not request it, you can ignore this email.",
    ],
  });
  // Test runs read the code from the server log (E2E_EMAIL_LOG is never set in production).
  if (process.env.E2E_EMAIL_LOG === "1") console.log(`[e2e-email-code] ${v} ${code}`);
  if (!sent) return { success: false, error: "We could not send the code right now. Please try again in a minute." };
  return { success: true, challenge };
}

/** Step 2: check the typed code. Returns a token that proves this email was verified. */
export async function verifyEmailCodeAction(
  email: string,
  code: string,
  challenge: string
): Promise<{ success: true; verifiedToken: string } | { success: false; error: string }> {
  const result = redeemEmailChallenge(email, code, challenge);
  return result.ok ? { success: true, verifiedToken: result.verifiedToken } : { success: false, error: result.error };
}
