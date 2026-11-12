// Flow G: contact form delivers to every ADMIN_NOTIFY_EMAIL address (checked in the send log).
import { BASE, launch, newPage, step, check, finish, plusEmail, RUN_ID, logOffset, waitForEmail, serverErrorsSince } from "./lib.mjs";

const off = logOffset();
const expected = (process.env.ADMIN_NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
const browser = await launch();
const { page } = await newPage(browser);

await step("G submit /contact form", async () => {
  await page.goto(`${BASE}/contact`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("e.g. Zainab Asad").fill(`TEST- Contact ${RUN_ID}`);
  await page.getByPlaceholder("you@domain.com").fill(plusEmail("contact"));
  await page.getByPlaceholder("Tell us what you have in mind...").fill("Automated test message from scripts/e2e/g-contact.mjs. Please ignore.");
  await page.getByRole("button", { name: /TRANSMIT MESSAGE/ }).click();
  await page.getByRole("heading", { name: /Signal Transmitted/ }).waitFor({ timeout: 45000 });
}, page);

const sent = await waitForEmail(off, `TEST- Contact ${RUN_ID}`, { count: expected.length });
check(`G contact email sent once per admin address (${expected.length})`, sent.length === expected.length, `sent ${sent.length}`);
const domains = expected.map((e) => e.split("@")[1]).sort().join(",");
check("G recipient domains match ADMIN_NOTIFY_EMAIL", sent.map((e) => e.domain).sort().join(",") === domains, `got ${sent.map((e) => e.domain).join(",")}`);
check("G no browser console errors", page.consoleErrors.length === 0, page.consoleErrors.slice(0, 3).join(" ; "));
const errs = serverErrorsSince(off);
check("G no server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("g-contact");
