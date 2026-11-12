// Flow A: paid membership application → admin approve → bank-details email → proof on /pay/<id>
// → admin verifies in /admin/applications (proof image must be visible) → create password → log in.
// Pass E2E_ANNUAL=1 to apply for the annual plan instead of monthly.
import {
  BASE, db, launch, newPage, login, step, check, finish, plusEmail, pngFile, record, RUN_ID,
  logOffset, waitForEmail, emailsSince, serverErrorsSince, randomPassword, sleep,
} from "./lib.mjs";
import { poll } from "./shared.mjs";

const annual = process.env.E2E_ANNUAL === "1";
const off = logOffset();
const email = plusEmail(annual ? "apply-annual" : "apply");
const username = `test_${RUN_ID}${annual ? "y" : "m"}`;
const fullName = `TEST- Applicant ${RUN_ID}`;
const browser = await launch();
const { page } = await newPage(browser);
const visible = (loc) => loc.locator("visible=true").first();

await step("A open /apply member form", async () => {
  await page.goto(`${BASE}/apply`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Apply as Member/ }).click();
  await page.getByRole("heading", { name: "Personal Information" }).waitFor();
}, page);

await step("A fill personal information", async () => {
  await visible(page.getByPlaceholder("johndoe")).fill(username);
  await visible(page.getByPlaceholder("you@example.com")).fill(email);
  await visible(page.getByPlaceholder("Your full name")).fill(fullName);
  await visible(page.getByPlaceholder("+92 300 1234567")).fill("+92 300 0000011");
  const selects = page.locator("select").locator("visible=true");
  await selects.nth(1).selectOption("Male");
  await visible(page.getByPlaceholder("All Future Events, VIP, Rave, etc.")).fill("Chai");
  await visible(page.locator('input[type="date"]')).fill("1995-05-05");
  await visible(page.getByRole("button", { name: "Next" })).click();
  await page.getByRole("heading", { name: /Identity/ }).waitFor();
}, page);

await step("A fill identity & emergency", async () => {
  await visible(page.getByPlaceholder("XXXXX-XXXXXXX-X")).fill("42101-0000000-1");
  await visible(page.getByPlaceholder("Contact name")).fill("TEST- Emergency");
  await visible(page.getByPlaceholder("+92 300 1234567")).fill("+92 300 0000012");
  await visible(page.getByPlaceholder("@yourusername")).fill("@test_solonomore");
  await visible(page.getByRole("button", { name: "Next" })).click();
  await page.getByRole("heading", { name: "Your Interests" }).waitFor();
}, page);

await step("A pick interest, go to photo & package", async () => {
  await page.getByRole("button", { name: "Music", exact: true }).click();
  await visible(page.getByRole("button", { name: "Next" })).click();
  await page.getByRole("heading", { name: "Upload Your Photo" }).waitFor();
}, page);

await step(`A choose Solo Pass Pro (${annual ? "annual" : "monthly"}) and submit`, async () => {
  const photo = page.locator('input[type="file"]').locator("visible=false");
  await page.locator('input[type="file"]').first().setInputFiles(pngFile("applicant-photo.png"));
  if (annual) await page.getByRole("button", { name: /Annual Billing/ }).click();
  await page.getByText("Solo Pass Pro", { exact: true }).first().click();
  if (annual) await page.getByText("PKR 19,800/yr").first().waitFor();
  await page.getByRole("button", { name: "Submit Application" }).click();
  await page.waitForFunction(() => !document.body.innerText.includes("SUBMITTING TO ADMIN"), null, { timeout: 45000 });
  await sleep(500);
  const err = await page.locator("text=/Failed|Please ensure|Please provide|already (exists|registered|applied)/i").first().textContent().catch(() => null);
  if (err && !/received|success/i.test(err)) return `form error: ${err.slice(0, 120)}`;
}, page);

const { data: app0 } = await poll(
  () => db.from("membership_applications").select("id,status,package_selected,package_price_pkr").eq("email", email).maybeSingle(),
  (r) => !!r.data
);
if (app0) record("membership_application", app0.id, email);
const expectPrice = annual ? 19800 : 1999;
check("A DB: application pending_admin_approval with correct package/price", app0?.status === "pending_admin_approval" && Number(app0?.package_price_pkr) === expectPrice,
  app0 ? `status=${app0.status} pkg=${app0.package_selected} price=${app0.package_price_pkr}` : "no application row");
const received = await waitForEmail(off, "We received your Solo-No-More application");
check("A email: 'application received' sent to applicant (gmail)", received.some((e) => e.domain === "gmail.com"), `got ${received.length}`);
const adminAlerts1 = emailsSince(off).filter((e) => e.subject.startsWith("[Solo-No-More]"));
check("A email: admin alert sent to both admin addresses", adminAlerts1.length >= 2, `admin alerts=${adminAlerts1.length}`);
if (!app0) { await browser.close(); finish("a-membership"); process.exit(); }

// Admin approves in /admin/users
const { page: admin } = await newPage(browser);
await step("A admin login", () => login(admin, process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD), admin);
const off2 = logOffset();
await step("A admin approves in /admin/users (Approve & Send Invoice)", async () => {
  await admin.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded" });
  await admin.getByPlaceholder("Search by name, @username, or email...").fill(email);
  const row = admin.locator("tr").filter({ hasText: email }).first();
  await row.waitFor({ timeout: 30000 });
  await row.getByRole("button").last().click();
  await admin.getByRole("button", { name: /Approve & Send Invoice/ }).click();
  await admin.getByText(/approved for payment/).waitFor({ timeout: 30000 });
}, admin);
const { data: app1 } = await poll(() => db.from("membership_applications").select("status").eq("id", app0.id).single(), (r) => r.data?.status === "payment_pending");
check("A DB: status payment_pending", app1?.status === "payment_pending", `status=${app1?.status}`);
const invoice = await waitForEmail(off2, "complete your payment");
check("A email: bank-details email sent", invoice.length === 1, `got ${invoice.length}`);

// Applicant uploads proof on /pay/<id>
await step("A /pay/<id> shows bank details and accepts screenshot", async () => {
  await page.goto(`${BASE}/pay/${app0.id}`, { waitUntil: "domcontentloaded" });
  await page.getByText(process.env.NEXT_PUBLIC_PAYMENT_IBAN).first().waitFor({ timeout: 30000 });
  await page.locator('input[type="file"]').setInputFiles(pngFile("membership-proof.png"));
  await page.getByPlaceholder("e.g. 9840210294").fill(`TEST-A-${RUN_ID}`);
  await page.getByRole("button", { name: /CONFIRM PAYMENT PROOF/ }).click();
  await page.getByRole("heading", { name: /Payment Proof Received/ }).waitFor({ timeout: 30000 });
}, page);
const { data: app2 } = await poll(() => db.from("membership_applications").select("status").eq("id", app0.id).single(), (r) => r.data?.status === "payment_submitted");
check("A DB: status payment_submitted", app2?.status === "payment_submitted", `status=${app2?.status}`);

// Admin verifies in /admin/applications — the screenshot must be visible there
const off3 = logOffset();
await step("A admin sees uploaded screenshot next to 'Verify Payment Proof'", async () => {
  await admin.goto(`${BASE}/admin/applications`, { waitUntil: "domcontentloaded" });
  await admin.getByPlaceholder("Search by name, email, @username, or CNIC...").fill(email);
  await admin.locator("tr").filter({ hasText: fullName }).first().getByRole("button", { name: "Details" }).click();
  await admin.getByRole("button", { name: /Verify Payment Proof/ }).waitFor({ timeout: 20000 });
  const img = admin.locator('img[alt="Proof"]').first();
  if (!(await img.count())) return "no proof image on the verify screen";
  await img.scrollIntoViewIfNeeded();
  const loaded = await img.evaluate((el) => el.complete && el.naturalWidth > 0);
  if (!(await img.isVisible()) || !loaded) return "proof image present but not loaded/visible";
}, admin);
await step("A admin clicks Verify Payment Proof & Generate Invite", async () => {
  await admin.getByRole("button", { name: /Verify Payment Proof/ }).click();
  await admin.getByText("Credential Setup Link:").waitFor({ timeout: 30000 });
}, admin);
const { data: app3 } = await poll(() => db.from("membership_applications").select("status,invite_token").eq("id", app0.id).single(), (r) => r.data?.status === "approved");
check("A DB: status approved with invite token", app3?.status === "approved" && !!app3?.invite_token, `status=${app3?.status}`);
const invite = await waitForEmail(off3, "create your Solo-No-More password");
check("A email: create-password email sent", invite.length === 1, `got ${invite.length}`);

// Applicant sets password (token read from the DB instead of the inbox) and logs in
const password = randomPassword();
await step("A set password on /create-credentials", async () => {
  await page.goto(`${BASE}/create-credentials?token=${app3.invite_token}`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("Minimum 8 characters").fill(password);
  await page.getByPlaceholder("Re-enter password").fill(password);
  await page.locator('button[type="submit"]').click();
  await page.getByRole("heading", { name: /Account Activated/ }).waitFor({ timeout: 45000 });
}, page);
const { data: app4 } = await poll(() => db.from("membership_applications").select("status").eq("id", app0.id).single(), (r) => r.data?.status === "credentials_created");
check("A DB: status credentials_created", app4?.status === "credentials_created", `status=${app4?.status}`);

const { page: fresh } = await newPage(browser);
await step("A log in with the new password", () => login(fresh, email, password, /\/dashboard/), fresh);

const { data: list } = await db.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = list?.users?.find((u) => (u.email || "").toLowerCase() === email);
if (user) record("auth_user+profile", user.id, email);
const { data: prof } = user
  ? await db.from("profiles").select("subscription_tier,account_status,subscription_expires_at,subscription_billing_cycle").eq("id", user.id).single()
  : { data: null };
const days = prof?.subscription_expires_at ? (new Date(prof.subscription_expires_at) - Date.now()) / 86400000 : null;
const [lo, hi] = annual ? [360, 370] : [27, 32];
check(`A DB: profile tier member, approved, ${annual ? "annual ~1 year" : "monthly ~1 month"} expiry`,
  prof?.subscription_tier === "member" && prof?.account_status === "approved" && prof?.subscription_billing_cycle === (annual ? "annual" : "monthly") && days > lo && days < hi,
  `tier=${prof?.subscription_tier} status=${prof?.account_status} cycle=${prof?.subscription_billing_cycle} days=${days?.toFixed(1)}`);
const ready = await waitForEmail(off3, "Your Solo-No-More account is ready");
check("A email: 'account ready' sent", ready.length === 1, `got ${ready.length}`);

const consoleErrs = [...page.consoleErrors, ...admin.consoleErrors, ...fresh.consoleErrors];
check("A no browser console errors", consoleErrs.length === 0, consoleErrs.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("A no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
console.log(`      emails: ${emailsSince(off).map((e) => e.subject.slice(0, 40)).join(" | ")}`);
await browser.close();
finish(`a-membership (${annual ? "annual" : "monthly"})`);
