// Shared fixtures and UI helpers for the e2e flows.
import { BASE, sleep } from "./lib.mjs";

/** Profile fields that make a TEST- member pass the profile-completeness gate (booking, beacons). */
export const COMPLETE_PROFILE = {
  phone: "+92 300 0000001",
  city: "Karachi",
  gender: "Male",
  date_of_birth: "1995-01-01",
  cnic_picture_url: "https://example.test/TEST-cnic.png",
  instagram_screenshot_url: "https://example.test/TEST-ig.png",
  emergency_contact_name: "TEST- Contact",
  emergency_contact_phone: "+92 300 0000002",
  instagram_username: "test_solonomore",
  vibe_tags: ["Chai"],
  is_guest: false,
};

/** In /admin/payments, find the card for this payer, confirm its proof image is visible, click approve. */
export async function approveInAdminPayments(page, payerEmail, buttonName = /Approve & Activate/) {
  await page.goto(`${BASE}/admin/payments`, { waitUntil: "domcontentloaded" });
  const card = page
    .locator("div")
    .filter({ hasText: payerEmail })
    .filter({ has: page.getByRole("button", { name: buttonName }) })
    .last();
  await card.waitFor({ timeout: 30000 });
  const img = card.locator('img[alt="Payment proof"]');
  if (!(await img.count())) return "no proof image shown on the payment card";
  if (!(await img.first().isVisible())) return "proof image not visible";
  await card.getByRole("button", { name: buttonName }).click();
  // card leaves the pending list, or a success message appears
  for (let i = 0; i < 60; i++) {
    await sleep(500);
    const stillThere = await card.getByRole("button", { name: buttonName }).count();
    const processing = await page.getByText("Processing...").count();
    if (!stillThere && !processing) return;
  }
  return "approve did not finish within 30s";
}

/** Polls fn() until predicate(result) is true or the timeout passes; returns the last result. */
export async function poll(fn, predicate, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  let r;
  do {
    r = await fn();
    if (predicate(r)) return r;
    await sleep(700);
  } while (Date.now() < end);
  return r;
}

// ── direct server-action calls (to test authorization, not just hidden buttons) ──
import fs from "fs";
import path from "path";
import { ROOT } from "./lib.mjs";

/** Looks up a server action's id in the production build manifest. */
export function actionId(exportedName, filename) {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".next/server/server-reference-manifest.json"), "utf8"));
  for (const [id, entry] of Object.entries(manifest.node || {})) {
    const w = Object.values(entry.workers || {})[0];
    if (w?.exportedName === exportedName && (!filename || w.filename === filename)) return id;
  }
  throw new Error(`server action ${exportedName} not found in manifest (run npm run build first)`);
}

/**
 * Calls a server action the way the browser does, using the cookies of `context`
 * (a Playwright BrowserContext; pass a fresh context for a signed-out call).
 * Returns { status, location, text, result } where result is the parsed return value if found.
 */
export async function callAction(context, pagePath, id, args) {
  const res = await context.request.post(`${BASE}${pagePath}`, {
    headers: {
      "Next-Action": id,
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "text/x-component",
      Origin: BASE,
    },
    data: JSON.stringify(args),
    maxRedirects: 0,
    failOnStatusCode: false,
  });
  const text = await res.text();
  let result = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^[0-9a-f]+:(.*)$/);
    if (!m) continue;
    try {
      const v = JSON.parse(m[1]);
      if (v && typeof v === "object" && ("success" in v || "error" in v)) result = v;
      else if (Array.isArray(v) && result === null) result = v;
    } catch {}
  }
  return { status: res.status(), location: res.headers()["location"] || res.headers()["x-action-redirect"] || "", text, result };
}
