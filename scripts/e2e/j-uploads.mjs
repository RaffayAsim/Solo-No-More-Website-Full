// Flow J: payment-proof upload guards. A non-image file and an image over 15 MB both show a
// clear error in the payment panel (no crash, nothing submitted).
import fs from "fs";
import path from "path";
import { BASE, OUT, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, logOffset, serverErrorsSince } from "./lib.mjs";
import { COMPLETE_PROFILE } from "./shared.mjs";

const off = logOffset();
const txt = path.join(OUT, "not-an-image.txt");
fs.writeFileSync(txt, "this is not an image");
const big = path.join(OUT, "too-big.png");
fs.writeFileSync(big, Buffer.alloc(16 * 1024 * 1024, 1));

const browser = await launch();
const member = await ensureUser(plusEmail("uploads"), { ...COMPLETE_PROFILE, full_name: "TEST- Upload Member", subscription_tier: "none" });
const { page } = await newPage(browser);
await step("J login + open payment modal", async () => {
  await login(page, member.email, member.password);
  await page.goto(`${BASE}/dashboard/upgrade`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Upgrade to Solo Pass Pro/ }).click();
  await page.getByText("Step 1 · Transfer to this account").waitFor();
}, page);

await step("J non-image file → clear error", async () => {
  await page.locator('input[type="file"]').setInputFiles({ name: "not-an-image.txt", mimeType: "text/plain", buffer: fs.readFileSync(txt) });
  await page.getByText("Please choose an image file").waitFor({ timeout: 10000 });
}, page);
await step("J image over 15 MB → clear error", async () => {
  await page.locator('input[type="file"]').setInputFiles({ name: "too-big.png", mimeType: "image/png", buffer: fs.readFileSync(big) });
  await page.getByText(/too large.*under 15 MB/).waitFor({ timeout: 10000 });
}, page);
await step("J submit stays disabled without a valid proof", async () => {
  if (await page.getByRole("button", { name: /Submit Payment Proof/ }).isEnabled()) return "submit button enabled";
}, page);
const { count } = await db.from("payment_submissions").select("id", { count: "exact", head: true }).eq("user_id", member.id);
check("J DB: no payment submission created", count === 0, `count=${count}`);
check("J no page crash (no uncaught errors)", !page.consoleErrors.some((e) => e.startsWith("pageerror")), page.consoleErrors.slice(0, 2).join(" ; "));
const errs = serverErrorsSince(off);
check("J no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
fs.rmSync(big, { force: true });
await browser.close();
finish("j-uploads");
