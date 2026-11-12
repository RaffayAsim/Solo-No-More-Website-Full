// Flow C: door scanner (manual entry). Needs .output/state-b.json from flow B.
// approved pass admits → same pass again is a duplicate → unapproved pass is refused →
// short 8-character code admits → manual-ticketing QHQ- code admits.
import fs from "fs";
import path from "path";
import { BASE, OUT, db, launch, newPage, login, step, check, finish, ensureUser, plusEmail, record, logOffset, serverErrorsSince, sleep } from "./lib.mjs";
import { COMPLETE_PROFILE, poll } from "./shared.mjs";

const off = logOffset();
const state = JSON.parse(fs.readFileSync(path.join(OUT, "state-b.json"), "utf8"));
const browser = await launch();
const { page: admin } = await newPage(browser);
await step("C admin login", () => login(admin, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD), admin);

// Three TEST- attendees for manual passes: short-code (active), QHQ (active), unapproved (pending)
const people = {
  short: await ensureUser(plusEmail("scan-short"), { ...COMPLETE_PROFILE, full_name: "TEST- Scan Short", subscription_tier: "member" }),
  qhq: await ensureUser(plusEmail("scan-qhq"), { ...COMPLETE_PROFILE, full_name: "TEST- Scan QHQ", subscription_tier: "member" }),
  pend: await ensureUser(plusEmail("scan-pend"), { ...COMPLETE_PROFILE, full_name: "TEST- Scan Pending", subscription_tier: "member" }),
};

async function assignManual(person, statusLabel) {
  await admin.goto(`${BASE}/admin/manual-ticketing`, { waitUntil: "domcontentloaded" });
  await admin.getByRole("button", { name: "Existing User", exact: true }).click();
  const form = admin.locator("form").filter({ has: admin.getByRole("button", { name: "Assign Ticket" }) });
  await form.getByRole("button", { name: /Select user/ }).click();
  await admin.getByPlaceholder("Search users...").fill(person.email);
  await admin.getByRole("button").filter({ hasText: person.email }).first().click().catch(async () => {
    await admin.getByPlaceholder("Search users...").fill("TEST- Scan");
    await admin.getByRole("button").filter({ hasText: (await db.from("profiles").select("full_name").eq("id", person.id).single()).data.full_name }).first().click();
  });
  await form.getByRole("button", { name: /Select event/ }).click();
  await admin.getByPlaceholder("Search events...").fill(state.title);
  await admin.getByRole("button").filter({ hasText: state.title }).first().click();
  await form.locator("select").filter({ has: admin.locator('option[value="Pending"]') }).selectOption(statusLabel);
  await form.getByRole("button", { name: "Assign Ticket" }).click();
  const r = await poll(
    () => db.from("event_tickets").select("id,qr_id,ticket_status").eq("event_id", state.eventId).eq("user_id", person.id).neq("ticket_status", "cancelled"),
    (x) => x.data?.length > 0
  );
  const t = r.data?.[0];
  if (!t) throw new Error("manual ticket not created");
  record("event_ticket", t.id, `manual ${statusLabel} for ${person.email}`);
  return t;
}

let tShort, tQhq, tPend;
await step("C manual-ticketing: assign active pass (short-code test)", async () => { tShort = await assignManual(people.short, "Confirm"); }, admin);
await step("C manual-ticketing: assign active QHQ pass", async () => {
  tQhq = await assignManual(people.qhq, "Confirm");
  if (!/^QHQ-/.test(tQhq.qr_id || "")) return `qr_id is ${tQhq.qr_id}`;
}, admin);
await step("C manual-ticketing: assign unapproved (pending) pass", async () => {
  tPend = await assignManual(people.pend, "Pending");
  if (tPend.ticket_status !== "pending") return `status=${tPend.ticket_status}`;
}, admin);

// Open the scanner for this event
await step("C open door scanner for the event", async () => {
  await admin.goto(`${BASE}/admin/events`, { waitUntil: "domcontentloaded" });
  await admin.locator("tr").filter({ hasText: state.title }).first().getByRole("button", { name: /Door Scanner/ }).click();
  await admin.getByPlaceholder(/Enter Ticket ID/).waitFor({ timeout: 20000 });
}, admin);

async function scan(code, expectText, name) {
  const input = admin.getByPlaceholder(/Enter Ticket ID/);
  await input.fill(code);
  await input.press("Enter");
  await admin.getByText(expectText).first().waitFor({ timeout: 20000 });
  if (name) await admin.getByRole("heading", { name }).first().waitFor({ timeout: 5000 });
  await sleep(300);
}
const status = async (id) => (await db.from("event_tickets").select("ticket_status").eq("id", id).single()).data?.ticket_status;

await step("C approved pass (full id) is admitted", () => scan(state.ticketId, /ENTRY GRANTED/, "TEST- Booker"), admin);
check("C DB: approved pass now scanned", (await status(state.ticketId)) === "scanned", `status=${await status(state.ticketId)}`);
await step("C same pass again → duplicate", () => scan(state.ticketId, /DUPLICATE SCAN/), admin);
await step("C unapproved pass is refused with 'Payment not verified' message", async () => {
  await scan(tPend?.id || "x", /ENTRY DENIED/, "TEST- Scan Pending");
  await admin.getByText("Payment not verified. Ask the guest to contact the Solo-No-More admin.").first().waitFor({ timeout: 5000 });
}, admin);
await step("C no 'Approve & Admit' shortcut for an unpaid pass", async () => {
  if (await admin.getByRole("button", { name: /Approve & Admit Guest Now/ }).count()) return "button is shown for an unpaid pass";
}, admin);
await step("C guest list shows no Approve button for the unpaid pass", async () => {
  await admin.getByRole("button", { name: /Guestlist Roster/ }).click();
  const row = admin.locator("div").filter({ hasText: "TEST- Scan Pending" }).filter({ hasText: "Payment not verified" }).last();
  await row.waitFor({ timeout: 10000 });
  if (await row.getByRole("button", { name: /^Approve$/ }).count()) return "Approve button shown for unpaid pass";
  await admin.getByRole("button", { name: /Live Camera Scanner/ }).click();
}, admin);
check("C DB: unapproved pass still pending", (await status(tPend?.id)) === "pending", `status=${await status(tPend?.id)}`);
await step("C short 8-character code is admitted", () => scan((tShort?.id || "").slice(0, 8), /ENTRY GRANTED/, "TEST- Scan Short"), admin);
check("C DB: short-code pass scanned", (await status(tShort?.id)) === "scanned", `status=${await status(tShort?.id)}`);
await step("C QHQ- manual pass code is admitted", () => scan(tQhq?.qr_id || "x", /ENTRY GRANTED/, "TEST- Scan QHQ"), admin);
check("C DB: QHQ pass scanned", (await status(tQhq?.id)) === "scanned", `status=${await status(tQhq?.id)}`);

const consoleErrs = admin.consoleErrors.filter((e) => !/camera|NotAllowedError|NotFoundError|Requested device/i.test(e));
check("C no browser console errors (camera errors ignored in headless)", consoleErrs.length === 0, consoleErrs.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("C no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("c-door-scanner");
