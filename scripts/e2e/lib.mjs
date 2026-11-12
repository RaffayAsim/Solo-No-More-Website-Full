// Shared helpers for the headless end-to-end scripts in scripts/e2e/.
// Run against a production build: `npm run build`, then
//   E2E_EMAIL_LOG=1 npx next start -p 3000 > scripts/e2e/.output/server.log 2>&1
// Each script prints one line per step: "PASS <step>" or "FAIL <step>: <reason>".
// Secrets are read from .env.local and never printed.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, "../..");
export const OUT = path.join(here, ".output");
fs.mkdirSync(OUT, { recursive: true });

// ── env ──────────────────────────────────────────────────────────────────────
export function loadEnv() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const i = t.indexOf("=");
    const k = t.slice(0, i).trim();
    if (process.env[k] !== undefined) continue;
    process.env[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
}
loadEnv();

export const BASE = (process.env.E2E_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
export const SERVER_LOG = process.env.E2E_SERVER_LOG || path.join(OUT, "server.log");
export const RUN_ID = process.env.E2E_RUN_ID || new Date().toISOString().slice(5, 16).replace(/[-:T]/g, "");

export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── reporting ────────────────────────────────────────────────────────────────
let failures = 0;
export function pass(step) {
  console.log(`PASS ${step}`);
}
export function fail(step, reason) {
  failures++;
  console.log(`FAIL ${step}: ${String(reason).replace(/\s+/g, " ").slice(0, 220)}`);
}
export function check(step, cond, reason) {
  cond ? pass(step) : fail(step, reason);
  return !!cond;
}
export function failureCount() {
  return failures;
}

/** Runs a step; a thrown error becomes a FAIL (with a screenshot when a page is given). */
export async function step(name, fn, page) {
  try {
    const r = await fn();
    if (r === false) return false;
    if (typeof r === "string") {
      fail(name, r);
      await shot(page, name);
      return false;
    }
    pass(name);
    return true;
  } catch (err) {
    fail(name, err?.message || err);
    await shot(page, name);
    return false;
  }
}

export async function shot(page, name) {
  if (!page) return;
  try {
    const f = path.join(OUT, `fail-${name.replace(/[^a-z0-9]+/gi, "_").slice(0, 60)}.png`);
    await page.screenshot({ path: f, fullPage: false });
    console.log(`      screenshot: ${f}`);
  } catch {}
}

// ── TEST- record registry (ids only, no secrets) ─────────────────────────────
const REG = path.join(OUT, "test-records.json");
export function record(kind, id, note = "") {
  const list = fs.existsSync(REG) ? JSON.parse(fs.readFileSync(REG, "utf8")) : [];
  if (!list.some((r) => r.kind === kind && r.id === id)) list.push({ kind, id, note, at: new Date().toISOString() });
  fs.writeFileSync(REG, JSON.stringify(list, null, 2));
}

// ── server log (email send log) ──────────────────────────────────────────────
export function logOffset() {
  return fs.existsSync(SERVER_LOG) ? fs.statSync(SERVER_LOG).size : 0;
}
export function logSince(offset) {
  if (!fs.existsSync(SERVER_LOG)) return "";
  const buf = fs.readFileSync(SERVER_LOG);
  return buf.subarray(offset).toString("utf8");
}
/** Email lines logged since offset: [{subject, domain}] (requires E2E_EMAIL_LOG=1 on the server). */
export function emailsSince(offset) {
  return [...logSince(offset).matchAll(/\[e2e-email\] sent "(.*?)" to @(\S+)/g)].map((m) => ({ subject: m[1], domain: m[2] }));
}
export async function waitForEmail(offset, subjectPart, { count = 1, timeoutMs = 25000 } = {}) {
  const end = Date.now() + timeoutMs;
  let found = [];
  while (Date.now() < end) {
    found = emailsSince(offset).filter((e) => e.subject.includes(subjectPart));
    if (found.length >= count) return found;
    await sleep(500);
  }
  return found;
}
export function serverErrorsSince(offset) {
  return logSince(offset)
    .split(/\r?\n/)
    .filter((l) => /\b(Error|TypeError|Unhandled|⨯)\b/.test(l) && !/\[e2e-email\]/.test(l));
}

// ── browser ──────────────────────────────────────────────────────────────────
export async function launch() {
  const browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || "chrome", headless: true });
  return browser;
}
/** New isolated context + page, collecting console errors. */
export async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") page.consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => page.consoleErrors.push(`pageerror @${new URL(page.url()).pathname}: ` + String(e.message).slice(0, 160)));
  page.setDefaultTimeout(30000);
  return { context, page };
}

export async function login(page, email, password, expectPath = /\/(dashboard|admin)/) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("name@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(expectPath, { timeout: 45000 });
}

// ── data helpers ─────────────────────────────────────────────────────────────
export function randomPassword(len = 24) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}
export function plusEmail(tag) {
  const [user, domain] = (process.env.SMTP_USER || "thesolonomore@gmail.com").split("@");
  return `${user}+test-${tag}-${RUN_ID}@${domain}`.toLowerCase();
}

/** Creates (or reuses) a confirmed auth user + approved profile. Returns { id, email, password }. */
export async function ensureUser(email, profile = {}) {
  email = email.toLowerCase();
  const password = randomPassword();
  let id = null;
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    // Already exists → reset the password so the script can log in.
    for (let pageNo = 1; pageNo <= 20 && !id; pageNo++) {
      const { data: list } = await db.auth.admin.listUsers({ page: pageNo, perPage: 200 });
      const u = list?.users?.find((x) => (x.email || "").toLowerCase() === email);
      if (u) id = u.id;
      if (!list?.users?.length) break;
    }
    if (!id) throw new Error(`could not create or find ${email}: ${error.message}`);
    await db.auth.admin.updateUserById(id, { password, email_confirm: true });
  } else {
    id = data.user.id;
  }
  const { error: pErr } = await db.from("profiles").upsert({ id, account_status: "approved", ...profile });
  if (pErr) throw new Error(`profile upsert failed: ${pErr.message}`);
  record("auth_user+profile", id, email);
  return { id, email, password };
}

/** A tiny valid PNG written to disk (for upload fields). */
export function pngFile(name = "proof.png") {
  const f = path.join(OUT, name);
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAQ0lEQVR4nO3PQQ0AIAzAQMC/5+GiHyRNNv8ONrPm5xz+HRAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEPgEnGuFAQeYsMzZAAAAAElFTkSuQmCC";
  fs.writeFileSync(f, Buffer.from(b64, "base64"));
  return f;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function finish(name) {
  const n = failureCount();
  console.log(`== ${name}: ${n ? n + " FAIL" : "all PASS"}`);
  process.exitCode = n ? 1 : 0;
}
