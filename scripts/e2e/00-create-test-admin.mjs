// Creates the TEST- admin account used by the e2e scripts and stores its login in .env.local
// (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD). Safe to re-run: an existing login is kept.
import fs from "fs";
import path from "path";
import { ROOT, db, ensureUser, pass, fail, finish } from "./lib.mjs";
import { createClient } from "@supabase/supabase-js";

const EMAIL = "test-admin@solonomore.test";
const envPath = path.join(ROOT, ".env.local");

async function canLogin(email, password) {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await anon.auth.signInWithPassword({ email, password });
  return !error;
}

if (process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD && (await canLogin(process.env.TEST_ADMIN_EMAIL, process.env.TEST_ADMIN_PASSWORD))) {
  pass("test admin already exists and can log in");
} else {
  try {
    const u = await ensureUser(EMAIL, { subscription_tier: "admin", account_status: "approved", full_name: "TEST- Admin" });
    let lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/).filter((l) => !/^\s*TEST_ADMIN_(EMAIL|PASSWORD)\s*=/.test(l));
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    lines.push("", "# TEST- admin for scripts/e2e (delete after testing)", `TEST_ADMIN_EMAIL=${u.email}`, `TEST_ADMIN_PASSWORD=${u.password}`);
    fs.writeFileSync(envPath, lines.join("\n") + "\n");
    pass("created test admin auth user + profile, login saved to .env.local");
    (await canLogin(u.email, u.password)) ? pass("test admin can log in") : fail("test admin can log in", "sign-in rejected");
  } catch (e) {
    fail("create test admin", e.message);
  }
}

const { data: prof } = await db.from("profiles").select("subscription_tier,account_status,full_name").eq("email", EMAIL).maybeSingle().then(
  (r) => r,
  () => ({ data: null })
);
if (prof) console.log(`      profile: tier=${prof.subscription_tier} status=${prof.account_status}`);
finish("00-create-test-admin");
