/**
 * Manual bank-transfer payment settings (shared by browser and server).
 *
 * ⚠️  The values below are PLACEHOLDERS. Replace them with the real account and
 * WhatsApp number before taking payments — either edit the defaults here or set
 * the NEXT_PUBLIC_PAYMENT_* environment variables in Vercel (no code change needed).
 */
// Each NEXT_PUBLIC_ variable is referenced literally so Next.js can inline it in the browser bundle.
/** Sample values are used only when no payment variable is set at all. */
const USE_SAMPLE_ACCOUNT = !(
  process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME ||
  process.env.NEXT_PUBLIC_PAYMENT_BRANCH ||
  process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_TITLE ||
  process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER ||
  process.env.NEXT_PUBLIC_PAYMENT_IBAN ||
  process.env.NEXT_PUBLIC_PAYMENT_RAAST_ID ||
  process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP
);
const sample = (value: string) => (USE_SAMPLE_ACCOUNT ? value : "");

export const PAYMENT_CONFIG = {
  bankName: process.env.NEXT_PUBLIC_PAYMENT_BANK_NAME || sample("Demo Bank Limited"),
  /** Optional branch shown under the bank name. Leave empty to hide. */
  branch: process.env.NEXT_PUBLIC_PAYMENT_BRANCH || "",
  accountTitle: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_TITLE || sample("Solo-No-More (Sample Account)"),
  /** Hidden when empty (e.g. only an IBAN is configured). */
  accountNumber: process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NUMBER || sample("0000-1234567890"),
  iban: process.env.NEXT_PUBLIC_PAYMENT_IBAN || sample("PK00DEMO0000001234567890"),
  /** Optional Raast ID shown under the account. Leave empty to hide. */
  raastId: process.env.NEXT_PUBLIC_PAYMENT_RAAST_ID || "",
  /** WhatsApp number in international format, digits only (e.g. 923001234567). */
  whatsappNumber: (process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP || "923000000000").replace(/\D/g, ""),
  /** True while the sample account above is still in use. */
  isPlaceholder: USE_SAMPLE_ACCOUNT,
};

/** Label/value rows for the bank account, in display order. Empty values are left out. */
export function bankAccountRows(): { label: string; value: string }[] {
  return [
    { label: "Bank", value: PAYMENT_CONFIG.bankName },
    { label: "Branch", value: PAYMENT_CONFIG.branch },
    { label: "Account Title", value: PAYMENT_CONFIG.accountTitle },
    { label: "Account Number", value: PAYMENT_CONFIG.accountNumber },
    { label: "IBAN", value: PAYMENT_CONFIG.iban },
    { label: "Raast ID", value: PAYMENT_CONFIG.raastId },
  ].filter((row) => row.value);
}

export type BillingCycle = "monthly" | "annual";

/**
 * Membership plans — the single source of truth for subscription prices (PKR).
 * These match the public /memberships page. The server always charges from this
 * table, so a tampered form can never change the price.
 *   annualTotal = what is actually paid for a year (the "billed yearly" figure)
 */
export const MEMBERSHIP_PLANS: Record<
  "member" | "family" | "partner",
  { name: string; monthly: number; annualTotal: number | null; annualPerMonth: number | null }
> = {
  member: { name: "Solo Pass Pro", monthly: 1999, annualTotal: 19800, annualPerMonth: 1650 },
  family: { name: "Founder Circle VIP", monthly: 4999, annualTotal: 49200, annualPerMonth: 4100 },
  partner: { name: "Partner Hub", monthly: 3500, annualTotal: null, annualPerMonth: null },
};

/** Monthly price per tier (kept for simple lookups). */
export const MEMBERSHIP_PRICES_PKR: Record<"member" | "family" | "partner", number> = {
  member: MEMBERSHIP_PLANS.member.monthly,
  family: MEMBERSHIP_PLANS.family.monthly,
  partner: MEMBERSHIP_PLANS.partner.monthly,
};

/** Amount due now for a tier and billing cycle. Falls back to monthly if no annual plan exists. */
export function getMembershipAmountPkr(tier: "member" | "family" | "partner", cycle: BillingCycle = "monthly"): number {
  const plan = MEMBERSHIP_PLANS[tier];
  return cycle === "annual" && plan.annualTotal ? plan.annualTotal : plan.monthly;
}

export function formatWhatsAppNumber(digits: string): string {
  if (digits.length === 12 && digits.startsWith("92")) {
    return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  return `+${digits}`;
}

/**
 * Optional follow-up after the proof was already submitted on the website. The proof
 * is in the admin queue, so the message only asks for a quicker confirmation — it never
 * asks the customer to send the screenshot again.
 */
export function buildWhatsAppProofLink(details: {
  purpose?: string;
  amountPkr?: number;
  reference?: string;
  transactionRef?: string;
  payerName?: string;
}): string {
  const lines = [
    "Assalam o Alaikum! I have submitted my payment proof on the Solo-No-More website.",
    details.purpose ? `For: ${details.purpose}` : "",
    details.amountPkr ? `Amount: PKR ${Number(details.amountPkr).toLocaleString("en-US")}` : "",
    details.reference ? `Reference: ${details.reference}` : "",
    details.payerName ? `Name: ${details.payerName}` : "",
    "Could you please confirm it? Thank you!",
  ].filter(Boolean);
  return `https://wa.me/${PAYMENT_CONFIG.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Membership application packages (shown on /apply), keyed by package name.
 * Older package names are kept so applications submitted before the rename still price correctly.
 */
export const APPLICATION_PACKAGES: Record<string, { monthly: number; annualTotal: number | null }> = {
  "Community Explorer": { monthly: 0, annualTotal: null },
  "Solo Pass Pro": { monthly: MEMBERSHIP_PLANS.member.monthly, annualTotal: MEMBERSHIP_PLANS.member.annualTotal },
  "Founder Circle VIP": { monthly: MEMBERSHIP_PLANS.family.monthly, annualTotal: MEMBERSHIP_PLANS.family.annualTotal },
  "Partner Residency": { monthly: 0, annualTotal: null },
  "Artist Residency": { monthly: 0, annualTotal: null },
  // legacy names
  "Chai Scout / Explorer": { monthly: 0, annualTotal: null },
  "VIP Inner Circle": { monthly: MEMBERSHIP_PLANS.family.monthly, annualTotal: MEMBERSHIP_PLANS.family.annualTotal },
};

export const ANNUAL_SUFFIX = " (Annual)";

/** Price for an application package name such as "Solo Pass Pro" or "Solo Pass Pro (Annual)". */
export function getApplicationPackageAmountPkr(packageLabel: string): number | null {
  const isAnnual = packageLabel.endsWith(ANNUAL_SUFFIX);
  const base = isAnnual ? packageLabel.slice(0, -ANNUAL_SUFFIX.length) : packageLabel;
  const pkg = APPLICATION_PACKAGES[base];
  if (!pkg) return null;
  return isAnnual && pkg.annualTotal ? pkg.annualTotal : pkg.monthly;
}
