// Flow D: beacons. Host creates a 1-slot beacon in the UI; two members request to join;
// host accepts #1 (count 0→1); accepting #2 into the full beacon is refused; #1 withdraws (1→0);
// #1 re-applies (pending again). A beacon whose time has passed is not on the feed.
import { BASE, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, record, RUN_ID, logOffset, serverErrorsSince, sleep } from "./lib.mjs";
import { COMPLETE_PROFILE, poll, actionId, callAction } from "./shared.mjs";

const off = logOffset();
const title = `TEST- Beacon D ${RUN_ID}`;
const browser = await launch();
const host = await ensureUser(plusEmail("bhost"), { ...COMPLETE_PROFILE, full_name: "TEST- Beacon Host", subscription_tier: "member" });
const j1 = await ensureUser(plusEmail("bj1"), { ...COMPLETE_PROFILE, full_name: "TEST- Joiner One", subscription_tier: "member" });
const j2 = await ensureUser(plusEmail("bj2"), { ...COMPLETE_PROFILE, full_name: "TEST- Joiner Two", subscription_tier: "member" });

const { page: hp } = await newPage(browser);
await step("D host login", () => login(hp, host.email, host.password), hp);

const when = new Date(Date.now() + 3 * 86400000);
const local = `${when.toISOString().slice(0, 10)}T19:00`;
await step("D host creates a 1-slot beacon", async () => {
  await hp.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await hp.getByRole("button", { name: /Broadcast/ }).first().click();
  await hp.getByPlaceholder(/Padel match at Sunset Club/).fill(title);
  await hp.getByPlaceholder(/What are the plans/).fill("Automated test beacon. Safe to delete.");
  const icebreaker = hp.getByPlaceholder(/Favorite chai spot/);
  if (await icebreaker.count()) await icebreaker.fill("Favourite chai?");
  await hp.getByPlaceholder(/Type venue or area/).fill("TEST- Spot");
  await hp.getByRole("button", { name: "Decrease slots" }).click();
  await hp.getByRole("button", { name: "Decrease slots" }).click();
  await hp.locator('input[type="datetime-local"]').fill(local);
  await hp.locator('button[type="submit"]').filter({ hasText: /Post Beacon/ }).click();
  await hp.getByText("✓ Posted!").waitFor({ timeout: 30000 });
}, hp);
const { data: b0 } = await poll(() => db.from("beacons").select("id,total_slots,filled_slots,status").eq("title", title).maybeSingle(), (r) => !!r.data);
if (b0) record("beacon", b0.id, title);
check("D DB: beacon active, 1 slot, 0 filled", b0?.status === "active" && b0?.total_slots === 1 && b0?.filled_slots === 0, b0 ? `${b0.status} ${b0.filled_slots}/${b0.total_slots}` : "no row");
if (!b0) { await browser.close(); finish("d-beacons"); process.exit(); }

async function requestJoin(page) {
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  const card = page.locator("div").filter({ hasText: title }).filter({ has: page.getByRole("button", { name: /Request to Join/ }) }).last();
  await card.waitFor({ timeout: 30000 });
  await card.getByRole("button", { name: /Request to Join/ }).first().click();
  await page.locator('input[type="checkbox"]').locator("visible=true").first().check();
  const answer = page.getByPlaceholder("Type your brief answer for the host...");
  if (await answer.count()) await answer.fill("Karak chai");
  await page.getByRole("button", { name: /Submit Join Request/ }).click();
  await page.getByText("Join Request Sent!").waitFor({ timeout: 30000 });
}
const appStatus = async (uid) => (await db.from("beacon_applications").select("id,status").eq("beacon_id", b0.id).eq("applicant_id", uid).maybeSingle()).data;
const filled = async () => (await db.from("beacons").select("filled_slots").eq("id", b0.id).single()).data?.filled_slots;

const { page: p1 } = await newPage(browser);
const { page: p2 } = await newPage(browser);
await step("D joiner 1 requests to join", async () => { await login(p1, j1.email, j1.password); await requestJoin(p1); }, p1);
await step("D joiner 2 requests to join", async () => { await login(p2, j2.email, j2.password); await requestJoin(p2); }, p2);
const a1 = await appStatus(j1.id), a2 = await appStatus(j2.id);
if (a1) record("beacon_application", a1.id, "joiner 1");
if (a2) record("beacon_application", a2.id, "joiner 2");
check("D DB: both requests pending", a1?.status === "pending" && a2?.status === "pending", `j1=${a1?.status} j2=${a2?.status}`);

async function accept(name) {
  await hp.goto(`${BASE}/dashboard/beacon/${b0.id}`, { waitUntil: "domcontentloaded" });
  await hp.getByRole("button", { name: /^Squad/ }).first().click();
  const card = hp.locator("div").filter({ hasText: name }).filter({ has: hp.getByRole("button", { name: /^(Accept|Approve)$/ }) }).last();
  await card.waitFor({ timeout: 30000 });
  await card.getByRole("button", { name: /^(Accept|Approve)$/ }).click();
}
await step("D host accepts joiner 1", () => accept("TEST- Joiner One"), hp);
const s1 = await poll(() => appStatus(j1.id), (r) => r?.status === "approved");
const f1 = await filled();
check("D DB: joiner 1 approved, count 0 → 1", s1?.status === "approved" && f1 === 1, `status=${s1?.status} filled=${f1}`);

await step("D UI: approve for joiner 2 is blocked when full", async () => {
  await hp.goto(`${BASE}/dashboard/beacon/${b0.id}`, { waitUntil: "domcontentloaded" });
  await hp.getByRole("button", { name: /^Squad/ }).first().click();
  const card = hp.locator("div").filter({ hasText: "TEST- Joiner Two" }).filter({ has: hp.getByRole("button", { name: /^(Accept|Approve)$/ }) }).last();
  if (!(await card.count())) return; // approve button not offered at all
  const btn = card.getByRole("button", { name: /^(Accept|Approve)$/ });
  if (await btn.isEnabled()) {
    await btn.click();
    await hp.getByText(/already full/i).first().waitFor({ timeout: 15000 });
  }
}, hp);
const rFull = await callAction(hp.context(), `/dashboard/beacon/${b0.id}`, actionId("approveApplicant"), [a2?.id]);
check("D server action: approving into a full beacon is refused", rFull.result?.success === false && /full/i.test(rFull.result?.error || ""), `status=${rFull.status} result=${JSON.stringify(rFull.result)?.slice(0, 120)}`);
await sleep(1500);
const s2 = await appStatus(j2.id), f2 = await filled();
check("D DB: joiner 2 still pending, count still 1", s2?.status === "pending" && f2 === 1, `status=${s2?.status} filled=${f2}`);

await step("D joiner 1 withdraws", async () => {
  await p1.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  const card = p1.locator("div").filter({ hasText: title }).filter({ has: p1.getByRole("button", { name: /Withdraw from Hangout/ }) }).last();
  await card.waitFor({ timeout: 30000 });
  await card.getByRole("button", { name: /Withdraw from Hangout/ }).click();
  await p1.getByRole("button", { name: /Confirm Leave/ }).first().click();
}, p1);
const s3 = await poll(() => appStatus(j1.id), (r) => r?.status !== "approved");
const f3 = await poll(filled, (n) => n === 0);
check("D DB: joiner 1 withdrawn, count 1 → 0", s3?.status !== "approved" && f3 === 0, `status=${s3?.status} filled=${f3}`);

await step("D joiner 1 re-applies", () => requestJoin(p1), p1);
const s4 = await poll(() => appStatus(j1.id), (r) => r?.status === "pending");
check("D DB: joiner 1 pending again (same application re-opened)", s4?.status === "pending" && s4?.id === a1?.id, `status=${s4?.status}`);

// Past beacon (inserted directly — the UI does not allow past dates) must not show on the feed
const pastTitle = `TEST- Past Beacon ${RUN_ID}`;
const { data: past, error: pastErr } = await db.from("beacons").insert({
  host_id: host.id, title: pastTitle, description: "Automated test (past).", category: "casual", city: "Karachi",
  total_slots: 3, filled_slots: 0, status: "active", visibility_mode: "stranger",
  scheduled_at: new Date(Date.now() - 2 * 3600000).toISOString(),
}).select("id").single();
if (past) record("beacon", past.id, pastTitle);
if (pastErr) check("D create past TEST- beacon", false, pastErr.message);
else await step("D past beacon is not on the feed (new beacon is)", async () => {
  await p2.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" });
  await p2.getByText(title).first().waitFor({ timeout: 30000 });
  if (await p2.getByText(pastTitle).count()) return "past beacon is visible on the feed";
}, p2);

const consoleErrs = [...hp.consoleErrors, ...p1.consoleErrors, ...p2.consoleErrors];
check("D no browser console errors", consoleErrs.length === 0, consoleErrs.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("D no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("d-beacons");
