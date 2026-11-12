// Flow I: membership expiry on a TEST- profile only (the real cron sweep is NOT called).
// Expiry 3 days ahead → exactly one reminder (notification + email), none on reload.
// Expiry in the past → tier drops to "none", account stays approved.
import { BASE, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, logOffset, waitForEmail, emailsSince, serverErrorsSince, sleep } from "./lib.mjs";
import { COMPLETE_PROFILE } from "./shared.mjs";

const off = logOffset();
const browser = await launch();
const m = await ensureUser(plusEmail("expiry"), {
  ...COMPLETE_PROFILE, full_name: "TEST- Expiry Member", subscription_tier: "member",
  subscription_billing_cycle: "monthly", subscription_reminder_sent_at: null,
  subscription_expires_at: new Date(Date.now() + 3 * 86400000).toISOString(),
});
const { page } = await newPage(browser);
await step("I login", () => login(page, m.email, m.password), page);

const reminders = async () =>
  (await db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", m.id).ilike("title", "%RENEWAL DUE%")).count;

await step("I dashboard load with expiry in 3 days", async () => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await sleep(3000);
}, page);
const r1 = await reminders();
const p1 = (await db.from("profiles").select("subscription_reminder_sent_at,subscription_tier").eq("id", m.id).single()).data;
check("I DB: one renewal notification, reminder_sent_at set, tier unchanged", r1 === 1 && !!p1?.subscription_reminder_sent_at && p1?.subscription_tier === "member",
  `notifications=${r1} sent_at=${!!p1?.subscription_reminder_sent_at} tier=${p1?.subscription_tier}`);
const e1 = await waitForEmail(off, "membership ends on");
check("I email: one renewal reminder", e1.length === 1, `got ${e1.length}`);

const off2 = logOffset();
await step("I reload dashboard twice", async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(2000);
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(3000);
}, page);
check("I DB: still exactly one renewal notification", (await reminders()) === 1, `notifications=${await reminders()}`);
check("I email: no second reminder", emailsSince(off2).filter((e) => e.subject.includes("membership ends on")).length === 0, "a second reminder email was sent");

await db.from("profiles").update({ subscription_expires_at: new Date(Date.now() - 3600000).toISOString() }).eq("id", m.id);
const off3 = logOffset();
await step("I dashboard load with expiry in the past", async () => {
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(3000);
}, page);
const p2 = (await db.from("profiles").select("subscription_tier,account_status").eq("id", m.id).single()).data;
check("I DB: tier dropped to none, account still approved", p2?.subscription_tier === "none" && p2?.account_status === "approved", `tier=${p2?.subscription_tier} status=${p2?.account_status}`);
const e3 = await waitForEmail(off3, "membership has expired");
check("I email: one 'membership has expired' email", e3.length === 1, `got ${e3.length}`);

check("I no browser console errors", page.consoleErrors.length === 0, page.consoleErrors.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("I no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("i-expiry");
