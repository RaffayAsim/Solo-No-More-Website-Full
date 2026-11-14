// Flow B: admin creates + publishes an event at 8:00 PM PKT (stored 15:00 UTC, shown 8:00 PM),
// member books → pending → uploads proof → WhatsApp link pre-filled → admin approves → active/paid,
// and a second booking for the same event is refused. Writes .output/state-b.json for flow C.
import fs from "fs";
import path from "path";
import {
  BASE, OUT, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, pngFile, record, RUN_ID,
  logOffset, waitForEmail, emailsSince, serverErrorsSince, sleep,
} from "./lib.mjs";
import { COMPLETE_PROFILE, approveInAdminPayments, poll } from "./shared.mjs";

const off = logOffset();
const title = `TEST- Event B ${RUN_ID}`;
const d = new Date(Date.now() + 10 * 86400000);
const eventDate = d.toISOString().slice(0, 10); // YYYY-MM-DD
const browser = await launch();

// ── admin creates + publishes the event ────────────────────────────────────
const { page: admin } = await newPage(browser);
await step("B admin login", () => login(admin, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD), admin);
await step("B admin creates & publishes event at 8:00 PM", async () => {
  await admin.goto(`${BASE}/admin/events`, { waitUntil: "domcontentloaded" });
  await admin.getByRole("button", { name: /Create Event/ }).first().click();
  const form = admin.locator("form").filter({ has: admin.getByPlaceholder("Event title") });
  await form.getByPlaceholder("Event title").fill(title);
  await form.getByPlaceholder("Event description").fill("Automated test event. Safe to delete.");
  await form.locator("select").filter({ has: admin.locator('option[value="published"]') }).selectOption("published");
  await form.locator('input[type="date"]').first().fill(eventDate);
  await form.locator('input[type="time"]').nth(0).fill("20:00");
  await form.locator('input[type="time"]').nth(1).fill("23:00");
  await form.getByPlaceholder(/Type venue or search hotspots/).fill("TEST- Venue");
  await form.getByPlaceholder("Price (PKR)").first().fill("1500");
  await form.getByPlaceholder("Capacity Spots").first().fill("20");
  await form.locator('button[type="submit"]').click();
  await admin.getByText(/created and published live|submitted to Admin Ops/).waitFor({ timeout: 45000 });
}, admin);

const { data: ev } = await poll(() => db.from("official_events").select("id,scheduled_at,price").eq("title", title).maybeSingle(), (r) => !!r.data);
if (ev) record("official_event", ev.id, title);
const iso = ev ? new Date(ev.scheduled_at).toISOString() : "";
check("B DB: scheduled_at stored as 15:00 UTC", iso === `${eventDate}T15:00:00.000Z`, `stored ${iso || "no row"}`);
if (!ev) { await browser.close(); finish("b-event-ticket"); process.exit(); }

await step("B public event page shows 8:00 PM", async () => {
  await admin.goto(`${BASE}/events/${ev.id}`, { waitUntil: "domcontentloaded" });
  await admin.getByText(/8:00\s?PM/).first().waitFor({ timeout: 20000 });
}, admin);
await step("B admin events table shows 8:00 PM", async () => {
  await admin.goto(`${BASE}/admin/events`, { waitUntil: "domcontentloaded" });
  const row = admin.locator("tr").filter({ hasText: title }).first();
  await row.waitFor({ timeout: 20000 });
  if (!/8:00\s?PM/.test(await row.innerText())) return `row time: ${(await row.innerText()).replace(/\s+/g, " ").slice(0, 120)}`;
}, admin);

// ── member books ───────────────────────────────────────────────────────────
const member = await ensureUser(plusEmail("book"), { ...COMPLETE_PROFILE, full_name: "TEST- Booker", subscription_tier: "member" });
const { page } = await newPage(browser);
await step("B member login", () => login(page, member.email, member.password), page);

async function openBooking() {
  await page.goto(`${BASE}/events/${ev.id}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Book Passes/ }).first().click();
  await page.getByRole("button", { name: /Continue to Payment/ }).click();
}
await step("B member books → bank details shown", async () => {
  await openBooking();
  await page.getByText("Step 1 · Transfer to this account").waitFor({ timeout: 30000 });
  await page.getByText(process.env.NEXT_PUBLIC_PAYMENT_IBAN).first().waitFor();
}, page);
const { data: t1 } = await poll(
  () => db.from("event_tickets").select("id,ticket_status,payment_status,payment_reference").eq("event_id", ev.id).eq("user_id", member.id).neq("ticket_status", "cancelled"),
  (r) => r.data?.length > 0
);
const ticket = t1?.[0];
if (ticket) record("event_ticket", ticket.id, `${title} / booker`);
check("B DB: ticket is pending before payment", ticket?.ticket_status === "pending", `status=${ticket?.ticket_status}`);

await step("B proof form has no transaction ID field and no WhatsApp before submit", async () => {
  await page.locator('input[type="file"]').setInputFiles(pngFile("ticket-proof.png"));
  if (await page.getByPlaceholder("e.g. 9840210294").count()) return "transaction ID field is still shown";
  if (await page.locator('a[href*="wa.me"]').count()) return "WhatsApp is offered before the proof is submitted";
}, page);
await step("B upload proof and submit", async () => {
  await page.getByRole("button", { name: /Submit Payment Proof/ }).click();
  await page.getByText("Payment proof received").first().waitFor({ timeout: 30000 });
}, page);
await step("B after submit: optional WhatsApp to wa.me/<NEXT_PUBLIC_PAYMENT_WHATSAPP> with the booking reference", async () => {
  const wa = page.locator('a[href*="wa.me"]').first();
  await wa.waitFor();
  const href = decodeURIComponent(await wa.getAttribute("href"));
  if (!href.startsWith(`https://wa.me/${(process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP || "").replace(/D/g, "")}?text=`)) return `href starts ${href.slice(0, 40)}`;
  for (const part of ["submitted my payment proof", `Reference: ${ticket?.payment_reference}`]) {
    if (!href.includes(part)) return `pre-filled text missing "${part}"`;
  }
}, page);
const { data: sub } = await poll(
  () => db.from("payment_submissions").select("id,status,booking_ref").eq("booking_ref", ticket?.payment_reference || "-").maybeSingle(),
  (r) => !!r.data
);
if (sub) record("payment_submission", sub.id, `${title} ticket`);
const { data: t2 } = await db.from("event_tickets").select("ticket_status").eq("id", ticket?.id || "").maybeSingle();
check("B DB: proof recorded (submission pending, ticket still pending)", sub?.status === "pending" && t2?.ticket_status === "pending", `sub=${sub?.status} ticket=${t2?.ticket_status}`);

// ── admin approves ─────────────────────────────────────────────────────────
await step("B admin approves in /admin/payments (proof image visible)", () => approveInAdminPayments(admin, member.email, /Approve & Activate Pass/), admin);
const { data: t3 } = await poll(() => db.from("event_tickets").select("ticket_status,payment_status").eq("id", ticket?.id || "").maybeSingle(), (r) => r.data?.ticket_status === "active");
check("B DB: pass active and paid", t3?.ticket_status === "active" && t3?.payment_status === "paid", `ticket=${t3?.ticket_status} payment=${t3?.payment_status}`);
const confirmed = await waitForEmail(off, "is confirmed");
check("B email: 'pass confirmed' sent", confirmed.length === 1, `got ${confirmed.length}`);

await step("B second booking for same event is refused", async () => {
  await page.goto(`${BASE}/events/${ev.id}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Book Passes/ }).first().click();
  await page.getByRole("button", { name: /Continue to Payment/ }).click();
  await page.getByText(/already hold a pass/).waitFor({ timeout: 20000 });
}, page);
const { count } = await db.from("event_tickets").select("id", { count: "exact", head: true }).eq("event_id", ev.id).eq("user_id", member.id).neq("ticket_status", "cancelled");
check("B DB: still exactly one ticket for the member", count === 1, `count=${count}`);

fs.writeFileSync(path.join(OUT, "state-b.json"), JSON.stringify({ eventId: ev.id, title, ticketId: ticket?.id, memberId: member.id, memberEmail: member.email }, null, 2));
const consoleErrs = [...page.consoleErrors, ...admin.consoleErrors];
check("B no browser console errors", consoleErrs.length === 0, consoleErrs.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("B no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
console.log(`      emails: ${emailsSince(off).map((e) => e.subject.slice(0, 40)).join(" | ")}`);
await browser.close();
finish("b-event-ticket");
