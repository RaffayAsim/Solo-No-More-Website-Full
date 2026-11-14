/**
 * Signup data checks shared by the browser (instant feedback) and the server (the real
 * gate — a tampered form cannot skip them). Each check returns an error message, or null
 * when the value is acceptable.
 *
 * These catch typos and obviously made-up values (random digits, impossible ages, a CNIC
 * that does not match the chosen gender). They cannot prove a person is real — that is
 * what the email code, the admin review and the CNIC photo/WhatsApp call are for.
 */

const ONLY_SAME_DIGIT = /^(\d)\1+$/;
const SEQUENTIAL = ["0123456789", "1234567890", "9876543210", "0987654321"];

function isSequentialRun(digits: string): boolean {
  return digits.length >= 6 && SEQUENTIAL.some((s) => s.includes(digits));
}

// ── Phone (Pakistani mobile) ─────────────────────────────────────────────

/** "0300 1234567", "+92-300-1234567", "923001234567" → "+923001234567"; null if not a PK mobile. */
export function normalizePkMobile(input: string): string | null {
  let d = String(input || "").replace(/[\s\-().]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0092")) d = d.slice(2);
  if (d.startsWith("92")) d = d.slice(2);
  else if (d.startsWith("0")) d = d.slice(1);
  if (!/^3\d{9}$/.test(d)) return null;
  return `+92${d}`;
}

/** Pakistani mobile numbers: 03XX XXXXXXX with a real network prefix (300–359). */
export function checkPkMobile(input: string, label = "Phone number"): string | null {
  if (!String(input || "").trim()) return `${label} is required.`;
  const n = normalizePkMobile(input);
  if (!n) return `${label} must be a Pakistani mobile number, e.g. 0300 1234567.`;
  const local = n.slice(3); // 3XXXXXXXXX
  const prefix = Number(local.slice(0, 3));
  if (prefix < 300 || prefix > 359) return `${label}: 03${local.slice(1, 3)} is not a Pakistani mobile network code.`;
  const subscriber = local.slice(3);
  if (ONLY_SAME_DIGIT.test(subscriber) || isSequentialRun(subscriber)) return `${label} does not look like a real number.`;
  return null;
}

/** Shown as 0300 1234567. */
export function formatPkMobile(input: string): string {
  const n = normalizePkMobile(input);
  return n ? `0${n.slice(3, 6)} ${n.slice(6)}` : String(input || "").trim();
}

// ── CNIC ─────────────────────────────────────────────────────────────────

export function normalizeCnic(input: string): string | null {
  const d = String(input || "").replace(/\D/g, "");
  if (d.length !== 13) return null;
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`;
}

/**
 * NADRA CNIC: 13 digits (XXXXX-XXXXXXX-X). The first digit is the province/region code
 * (1–7) and the last digit is odd for men and even for women.
 */
export function checkCnic(input: string, gender?: string): string | null {
  if (!String(input || "").trim()) return "CNIC number is required.";
  const c = normalizeCnic(input);
  if (!c) return "CNIC must have 13 digits, e.g. 42101-1234567-1.";
  const digits = c.replace(/-/g, "");
  if (!/^[1-7]/.test(digits)) return "This CNIC number is not valid (the first digit must be 1–7).";
  if (ONLY_SAME_DIGIT.test(digits.slice(5, 12)) || isSequentialRun(digits.slice(5, 12))) {
    return "This CNIC number does not look real. Please type it exactly as on your card.";
  }
  const last = Number(digits[12]);
  const g = (gender || "").toLowerCase();
  if (g === "male" && last % 2 === 0) return "This CNIC belongs to a female card holder (last digit is even). Please check the CNIC or the gender you selected.";
  if (g === "female" && last % 2 === 1) return "This CNIC belongs to a male card holder (last digit is odd). Please check the CNIC or the gender you selected.";
  return null;
}

// ── Date of birth ────────────────────────────────────────────────────────

export const MIN_AGE = 18;
export const MAX_AGE = 80;

export function ageOn(dob: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dob || ""));
  if (!m) return null;
  const birth = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (birth.getMonth() !== Number(m[2]) - 1) return null; // e.g. 31 Feb
  let age = today.getFullYear() - birth.getFullYear();
  const md = today.getMonth() - birth.getMonth();
  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function checkDateOfBirth(dob: string): string | null {
  if (!String(dob || "").trim()) return "Date of birth is required.";
  const age = ageOn(dob);
  if (age === null) return "Please pick a valid date of birth.";
  if (age < 0) return "Date of birth cannot be in the future.";
  if (age < MIN_AGE) return `You must be at least ${MIN_AGE} to join Solo-No-More.`;
  if (age > MAX_AGE) return "Please check your date of birth.";
  return null;
}

/** For <input type="date" max=...>: the latest allowed birthday (18 years ago). */
export function latestAllowedDob(today = new Date()): string {
  const d = new Date(today.getFullYear() - MIN_AGE, today.getMonth(), today.getDate());
  return d.toISOString().slice(0, 10);
}

// ── Names ────────────────────────────────────────────────────────────────

export function checkPersonName(input: string, label = "Full name"): string | null {
  const v = String(input || "").trim().replace(/\s+/g, " ");
  if (!v) return `${label} is required.`;
  if (v.length < 3 || v.length > 60) return `${label} must be 3–60 characters.`;
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(v)) return `${label} can only contain letters, spaces, dots, apostrophes and hyphens.`;
  const letters = v.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3 || /^(.)\1+$/u.test(letters.toLowerCase())) return `Please enter a real ${label.toLowerCase()}.`;
  return null;
}

export function checkBusinessName(input: string, label = "Business name"): string | null {
  const v = String(input || "").trim();
  if (!v) return `${label} is required.`;
  if (v.length < 2 || v.length > 80) return `${label} must be 2–80 characters.`;
  if (!/[\p{L}]{2}/u.test(v)) return `Please enter a real ${label.toLowerCase()}.`;
  return null;
}

// ── Username ─────────────────────────────────────────────────────────────

export function checkUsername(input: string): string | null {
  const v = String(input || "").trim().replace(/^@/, "");
  if (!v) return "Username is required.";
  if (!/^[a-zA-Z0-9_.]{3,24}$/.test(v)) return "Username must be 3–24 characters: letters, numbers, dots and underscores.";
  return null;
}

// ── Instagram ────────────────────────────────────────────────────────────

/** "@name", "name", "instagram.com/name", "https://www.instagram.com/name/" → "name". */
export function normalizeInstagram(input: string): string {
  let v = String(input || "").trim();
  const m = /instagram\.com\/([^/?#\s]+)/i.exec(v);
  if (m) v = m[1];
  return v.replace(/^@/, "").replace(/\/+$/, "").toLowerCase();
}

/** Instagram's own username rules: 1–30 of letters, numbers, "." and "_", no leading/trailing or double dots. */
export function checkInstagram(input: string, required = false): string | null {
  const raw = String(input || "").trim();
  if (!raw) return required ? "Instagram username is required." : null;
  const v = normalizeInstagram(raw);
  if (!/^[a-z0-9._]{1,30}$/.test(v)) return "Instagram username can only have letters, numbers, dots and underscores (max 30).";
  if (v.startsWith(".") || v.endsWith(".") || v.includes("..")) return "That is not a valid Instagram username.";
  if (/^\d+$/.test(v)) return "That is not a valid Instagram username.";
  return null;
}

// ── Email ────────────────────────────────────────────────────────────────

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Throwaway inbox services — accounts on these cannot be verified later. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "10minutemail.com", "tempmail.com", "temp-mail.org",
  "yopmail.com", "trashmail.com", "getnada.com", "sharklasers.com", "dispostable.com", "maildrop.cc",
  "fakeinbox.com", "throwawaymail.com", "mintemail.com", "emailondeck.com", "mohmal.com", "tempail.com",
  "moakt.com", "burnermail.io", "mailnesia.com", "spamgourmet.com", "inboxkitten.com", "tempr.email",
]);

export function checkEmail(input: string): string | null {
  const v = String(input || "").trim().toLowerCase();
  if (!v) return "Email is required.";
  if (!EMAIL.test(v) || v.length > 120) return "Please enter a valid email address.";
  const domain = v.split("@")[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return "Temporary email addresses are not accepted. Please use your personal email.";
  return null;
}

// ── Whole forms ──────────────────────────────────────────────────────────

export interface MemberSignupFields {
  username: string;
  email: string;
  fullName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  cnic: string;
  emergencyName: string;
  emergencyPhone: string;
  instagram?: string;
}

/** Field → message for every problem in a member application. Empty object = all good. */
export function validateMemberSignup(f: MemberSignupFields): Record<string, string> {
  const errors: Record<string, string> = {};
  const put = (k: string, m: string | null) => {
    if (m) errors[k] = m;
  };
  put("username", checkUsername(f.username));
  put("email", checkEmail(f.email));
  put("fullName", checkPersonName(f.fullName));
  put("phone", checkPkMobile(f.phone));
  put("dateOfBirth", checkDateOfBirth(f.dateOfBirth));
  put("cnic", checkCnic(f.cnic, f.gender));
  put("emergencyName", checkPersonName(f.emergencyName, "Emergency contact name"));
  put("emergencyPhone", checkPkMobile(f.emergencyPhone, "Emergency contact phone"));
  put("instagram", checkInstagram(f.instagram || ""));
  if (!errors.phone && !errors.emergencyPhone && normalizePkMobile(f.phone) === normalizePkMobile(f.emergencyPhone)) {
    errors.emergencyPhone = "Emergency contact phone must be someone else's number.";
  }
  if (!errors.fullName && !errors.emergencyName && f.fullName.trim().toLowerCase() === f.emergencyName.trim().toLowerCase()) {
    errors.emergencyName = "Emergency contact must be another person.";
  }
  return errors;
}

export function firstError(errors: Record<string, string>): string | null {
  const k = Object.keys(errors)[0];
  return k ? errors[k] : null;
}
