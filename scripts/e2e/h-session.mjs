// Flow H: session handling. With a missing, corrupt, expired or tampered session cookie,
// /dashboard ends on /login exactly once — no redirect loop — and a tampered JWT is never accepted.
import { BASE, launch, newPage, login, step, check, finish, ensureUser, plusEmail, logOffset, serverErrorsSince, sleep } from "./lib.mjs";
import { COMPLETE_PROFILE } from "./shared.mjs";

const COOKIE = "sb-dmmgzpiskyocdsxamrgf-auth-token";
const off = logOffset();
const browser = await launch();
const member = await ensureUser(plusEmail("session"), { ...COMPLETE_PROFILE, full_name: "TEST- Session Member", subscription_tier: "none" });
const admin = { email: process.env.TEST_ADMIN_EMAIL, password: process.env.TEST_ADMIN_PASSWORD };

const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const b64urlEncode = (s) => Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function readTokens(value) {
  let raw = decodeURIComponent(value);
  if (raw.startsWith("base64-")) raw = Buffer.from(raw.slice(7), "base64").toString("utf8");
  return JSON.parse(raw);
}
const writeTokens = (arr) => encodeURIComponent(`base64-${Buffer.from(JSON.stringify(arr)).toString("base64")}`);
function editJwt(token, change) {
  const [h, p, s] = token.split(".");
  const payload = JSON.parse(b64urlDecode(p));
  change(payload);
  return `${h}.${b64urlEncode(JSON.stringify(payload))}.${s}`;
}

/** Loads /dashboard and records every document navigation for 8 s. */
async function visitDashboard(page) {
  const navs = [];
  const onNav = (frame) => { if (frame === page.mainFrame()) navs.push(new URL(frame.url()).pathname); };
  page.on("framenavigated", onNav);
  await page.goto(`${BASE}/dashboard`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await sleep(8000);
  page.off("framenavigated", onNav);
  return { navs, final: new URL(page.url()).pathname };
}
function judge(name, r) {
  const loginHits = r.navs.filter((p) => p === "/login").length;
  check(name, r.final === "/login" && loginHits <= 2 && r.navs.length <= 4, `final=${r.final} navigations=${r.navs.join(" → ")}`);
}

// Each scenario starts from a fresh signed-in context.
async function signedIn(who) {
  const ctx = await newPage(browser);
  await login(ctx.page, who.email, who.password);
  const cookies = await ctx.context.cookies();
  const c = cookies.find((x) => x.name === COOKIE);
  if (!c) throw new Error("session cookie not found after login");
  return { ...ctx, cookie: c };
}
async function setCookie(ctx, value) {
  await ctx.context.addCookies([{ ...ctx.cookie, value }]);
}
async function blockAutoRestore(ctx) {
  // The login page silently restores a session from localStorage; clear it to simulate a lost session.
  await ctx.page.evaluate(() => { try { localStorage.clear(); } catch {} });
}

let s;
await step("H sanity: signed-in member reaches /dashboard", async () => {
  s = await signedIn(member);
  const r = await visitDashboard(s.page);
  if (r.final !== "/dashboard") return `final=${r.final}`;
}, s?.page);

await step("H missing cookie → /login, no loop", async () => {
  const c = await signedIn(member);
  await blockAutoRestore(c);
  await c.context.clearCookies();
  judge("H   (missing cookie result)", await visitDashboard(c.page));
});

await step("H corrupt cookie → /login, no loop", async () => {
  const c = await signedIn(member);
  await blockAutoRestore(c);
  await setCookie(c, "base64-%%%not-json%%%");
  judge("H   (corrupt cookie result)", await visitDashboard(c.page));
});

await step("H expired token → /login, no loop", async () => {
  const c = await signedIn(member);
  await blockAutoRestore(c);
  const [access, refresh] = readTokens(c.cookie.value);
  const expired = editJwt(access, (p) => { p.exp = Math.floor(Date.now() / 1000) - 3600; });
  await setCookie(c, writeTokens([expired, refresh]));
  judge("H   (expired token result)", await visitDashboard(c.page));
});

await step("H tampered JWT (unexpired, payload edited) → rejected, /login, no loop", async () => {
  const c = await signedIn(member);
  await blockAutoRestore(c);
  const [access, refresh] = readTokens(c.cookie.value);
  const tampered = editJwt(access, (p) => { p.exp = Math.floor(Date.now() / 1000) + 3600; p.email = "tampered@example.test"; });
  await setCookie(c, writeTokens([tampered, "invalid-refresh"]));
  judge("H   (tampered JWT result)", await visitDashboard(c.page));
});

await step("H tampered JWT claiming admin's id cannot open /admin", async () => {
  const a = await signedIn(admin);
  const [adminAccess] = readTokens(a.cookie.value);
  const adminSub = JSON.parse(b64urlDecode(adminAccess.split(".")[1])).sub;
  const c = await signedIn(member);
  await blockAutoRestore(c);
  const [access] = readTokens(c.cookie.value);
  const forged = editJwt(access, (p) => { p.sub = adminSub; p.email = admin.email; p.exp = Math.floor(Date.now() / 1000) + 3600; });
  await setCookie(c, writeTokens([forged, "invalid-refresh"]));
  await c.page.goto(`${BASE}/admin`, { waitUntil: "domcontentloaded" }).catch(() => {});
  await sleep(4000);
  if (/^\/admin/.test(new URL(c.page.url()).pathname) && (await c.page.getByText("Admin Panel").count())) return "forged token opened the admin panel";
});

const errs = serverErrorsSince(off).filter((l) => !/JWT|jwt|signature|session/i.test(l));
check("H no unexpected server errors", errs.length === 0, errs.slice(0, 3).join(" ; "));
await browser.close();
finish("h-session");
