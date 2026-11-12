// Flow E: permissions — UI and server actions.
//  1. a normal member cannot open /admin
//  2. a sub-admin created in /admin/settings WITHOUT payments.verify cannot approve a payment
//     (UI and a direct server-action call; the submission stays pending)
//  3. a partner cannot edit another creator's event (direct saveRichEventAction call; title unchanged)
//  4. signed-out calls to team-permissions actions are refused
import fs from "fs";
import path from "path";
import { BASE, OUT, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, record, RUN_ID, logOffset, serverErrorsSince, sleep, pngFile } from "./lib.mjs";
import { COMPLETE_PROFILE, poll, actionId, callAction } from "./shared.mjs";

const off = logOffset();
const browser = await launch();
const member = await ensureUser(plusEmail("perm-member"), { ...COMPLETE_PROFILE, full_name: "TEST- Perm Member", subscription_tier: "member" });
const subUser = await ensureUser(plusEmail("perm-subadmin"), { ...COMPLETE_PROFILE, full_name: `TEST- SubAdmin ${RUN_ID}`, subscription_tier: "member" });
const partner = await ensureUser(plusEmail("perm-partner"), {
  ...COMPLETE_PROFILE, full_name: "TEST- Partner", subscription_tier: "partner", is_partner: true, business_name: "TEST- Partner Venue",
});

// ── 1. member cannot open /admin ───────────────────────────────────────────
const m = await newPage(browser);
await step("E member login", () => login(m.page, member.email, member.password), m.page);
await step("E member cannot open /admin", async () => {
  await m.page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" });
  await sleep(2000);
  const p = new URL(m.page.url()).pathname;
  if (p.startsWith("/admin") && (await m.page.getByText("Admin Panel").count())) return "admin panel rendered for a member";
}, m.page);
await step("E member cannot open /admin/payments", async () => {
  await m.page.goto(`${BASE}/admin/payments`, { waitUntil: "domcontentloaded" });
  await sleep(2000);
  if (await m.page.getByRole("button", { name: /Approve & Activate/ }).count()) return "payments queue rendered for a member";
}, m.page);

// A pending TEST- payment submission to attack (inserted directly as setup)
const { data: sub, error: subErr } = await db.from("payment_submissions").insert({
  user_id: member.id, purpose: "membership_upgrade", amount_pkr: 1999, tier_requested: "member",
  payment_method: "bank_transfer", transaction_ref: `TEST-E-${RUN_ID}`, payer_name: "TEST- Perm Member",
  payer_email: member.email, status: "pending", proof_image_url: `data:image/png;base64,${fs.readFileSync(pngFile("perm-proof.png")).toString("base64")}`,
}).select("id").single();
if (sub) record("payment_submission", sub.id, "flow E target (inserted)");
check("E setup: pending TEST- payment submission", !!sub, subErr?.message);

const reviewId = actionId("reviewPaymentSubmissionAction", "app/actions/billing.ts");
const r1 = await callAction(m.context, "/admin/payments", reviewId, [sub?.id, "approved", ""]);
check("E member: direct approve call refused", !(r1.result && r1.result.success === true), `status=${r1.status} result=${JSON.stringify(r1.result)?.slice(0, 120)}`);

// ── 2. sub-admin without payments.verify ───────────────────────────────────
const a = await newPage(browser);
await step("E admin login", () => login(a.page, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD), a.page);
await step("E admin creates sub-admin WITHOUT 'Confirm Payment Receipts'", async () => {
  await a.page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
  await a.page.getByRole("button", { name: /\+ Add Sub-Admin/ }).click();
  await a.page.getByPlaceholder("Filter directory by name, email, or phone...").fill(subUser.email);
  const list = a.page.locator("select[size]");
  await list.locator("option").filter({ hasText: subUser.email }).first().waitFor({ timeout: 20000 });
  await list.selectOption({ value: subUser.id });
  const verifyBox = a.page.locator("label").filter({ hasText: "Confirm Payment Receipts" }).locator('input[type="checkbox"]');
  if (await verifyBox.isChecked()) await verifyBox.uncheck();
  const viewBox = a.page.locator("label").filter({ hasText: "View Payment Receipts" }).locator('input[type="checkbox"]');
  if (!(await viewBox.isChecked())) await viewBox.check();
  await a.page.getByRole("button", { name: /Assign Selected User as Sub-Admin/ }).click();
  await a.page.getByText(`TEST- SubAdmin ${RUN_ID}`).first().waitFor({ timeout: 30000 });
}, a.page);
const { data: dRow } = await poll(() => db.from("platform_settings").select("value").eq("key", "team_delegations").maybeSingle(), (r) => (r.data?.value || []).some((d) => d.manager_user_id === subUser.id));
const deleg = (dRow?.value || []).find((d) => d.manager_user_id === subUser.id && d.type === "sub_admin" && d.status === "active");
check("E DB: sub-admin delegation saved with payments.view and without payments.verify",
  !!deleg && deleg.permissions.includes("payments.view") && !deleg.permissions.includes("payments.verify"),
  deleg ? `permissions=${deleg.permissions.join(",")}` : "delegation not found");
record("sub_admin_delegation", subUser.id, "platform_settings delegation for TEST- sub-admin");

const s = await newPage(browser);
await step("E sub-admin login", () => login(s.page, subUser.email, subUser.password), s.page);
await step("E sub-admin UI: approving the payment does not succeed", async () => {
  await s.page.goto(`${BASE}/admin/payments`, { waitUntil: "domcontentloaded" });
  await sleep(2500);
  const card = s.page.locator("div").filter({ hasText: member.email }).filter({ has: s.page.getByRole("button", { name: /Approve & Activate/ }) }).last();
  if (await card.count()) {
    await card.getByRole("button", { name: /Approve & Activate/ }).click();
    await sleep(3000);
  }
}, s.page);
const r2 = await callAction(s.context, "/admin/payments", reviewId, [sub?.id, "approved", ""]);
check("E sub-admin: direct approve call refused", !(r2.result && r2.result.success === true), `status=${r2.status} result=${JSON.stringify(r2.result)?.slice(0, 120)}`);
const { data: subAfter } = await db.from("payment_submissions").select("status").eq("id", sub?.id || "").maybeSingle();
const { data: memAfter } = await db.from("profiles").select("subscription_expires_at").eq("id", member.id).single();
check("E DB: submission still pending, member not activated", subAfter?.status === "pending" && !memAfter?.subscription_expires_at, `status=${subAfter?.status} expires=${memAfter?.subscription_expires_at}`);

// ── 3. partner cannot edit another creator's event ─────────────────────────
const stateB = fs.existsSync(path.join(OUT, "state-b.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "state-b.json"), "utf8")) : null;
const p = await newPage(browser);
await step("E partner login", () => login(p.page, partner.email, partner.password, /\/dashboard/), p.page);
if (!stateB) check("E partner edit test", false, "state-b.json missing — run b-event-ticket.mjs first");
else {
  const saveId = actionId("saveRichEventAction");
  const d = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
  const r3 = await callAction(p.context, "/dashboard/partner", saveId, [{
    id: stateB.eventId, title: "HACKED BY PARTNER", status: "published", description: "x", eventDate: d, startTime: "20:00", endTime: "23:00",
    venueName: "x", fullAddress: "", tierPackages: [{ id: "t", name: "GA", price: 1, spots: 1 }], partnerCollaboration: "No partner",
    featureImage: "", sliderImages: [], attendingLabel: "", capacityLimit: 1, visibility: "public", eventCategory: "", audience: "",
    publishDate: "", organizer: null, importantInfo: [], lineups: [], creatorType: "artist",
  }]);
  check("E partner: direct edit of admin's event refused", !(r3.result && r3.result.success === true), `status=${r3.status} result=${JSON.stringify(r3.result)?.slice(0, 120)}`);
  const { data: ev } = await db.from("official_events").select("title,price").eq("id", stateB.eventId).single();
  check("E DB: event title unchanged", ev?.title === stateB.title, `title=${ev?.title}`);
}

// ── 4. signed-out team-permissions actions ─────────────────────────────────
const anon = await browser.newContext();
const r4 = await callAction(anon, "/admin/settings", actionId("getAllPlatformUsersForAdminAction"), []);
const leaked = Array.isArray(r4.result) ? r4.result.length : r4.text.includes("@") ? "possible" : 0;
check("E signed-out getAllPlatformUsersForAdminAction returns no users", !leaked, `status=${r4.status} returned ${leaked} users`);
const r5 = await callAction(anon, "/admin/settings", actionId("assignExistingUserAsManagerAction"), [{
  delegatorId: subUser.id, delegatorName: "x", type: "sub_admin", targetUserId: member.id, managerName: "x", managerEmail: member.email, permissions: ["payments.verify"],
}]);
check("E signed-out assignExistingUserAsManagerAction refused", !(r5.result && r5.result.success === true), `status=${r5.status} result=${JSON.stringify(r5.result)?.slice(0, 120)}`);
const { data: settings2 } = await db.from("platform_settings").select("*").limit(50);
check("E DB: member was not made a manager by the signed-out call", !(settings2 || []).some((r) => JSON.stringify(r.value || "").includes(member.id)), "member id found in delegations");

// ERR_NAME_NOT_RESOLVED comes from the placeholder proof image URL (example.test) used in this test's setup row.
const consoleErrs = [...m.page.consoleErrors, ...a.page.consoleErrors, ...s.page.consoleErrors, ...p.page.consoleErrors].filter((e) => !/ERR_NAME_NOT_RESOLVED/.test(e));
check("E no browser console errors", consoleErrs.length === 0, consoleErrs.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("E no unexpected server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("e-permissions");
