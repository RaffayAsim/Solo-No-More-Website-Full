// Deletes the TEST- records listed in scripts/e2e/.output/test-records.json.
//   node scripts/e2e/cleanup-test-records.mjs           → dry run: counts per table, nothing deleted
//   node scripts/e2e/cleanup-test-records.mjs --apply   → deletes, then prints counts again
// Only ids from the registry are touched, plus rows that point at those ids (e.g. a TEST- user's
// notifications) and their uploaded images in storage. Safety check: every profile/user deleted
// must have a TEST- name or a +test-…@ / test-admin@ email.
import fs from "fs";
import path from "path";
import { OUT, db, ROOT } from "./lib.mjs";

const APPLY = process.argv.includes("--apply");
const recs = JSON.parse(fs.readFileSync(path.join(OUT, "test-records.json"), "utf8"));
const ids = (kind) => [...new Set(recs.filter((r) => r.kind === kind).map((r) => r.id))];
const userIds = ids("auth_user+profile");
const eventIds = ids("official_event");
const beaconIds = ids("beacon");
const appIds = ids("membership_application");
const subAdminIds = ids("sub_admin_delegation");

const isTestEmail = (e) => /\+test-|^test-admin@solonomore\.test$/i.test(e || "");
const chunks = (a, n = 100) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function countIn(table, col, list) {
  let n = 0;
  for (const c of chunks(list)) {
    if (!c.length) continue;
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true }).in(col, c);
    if (error) return `error: ${error.message}`;
    n += count || 0;
  }
  return n;
}
async function del(table, col, list) {
  let n = 0;
  for (const c of chunks(list)) {
    if (!c.length) continue;
    const { data, error } = await db.from(table).delete().in(col, c).select("*");
    if (error) throw new Error(`${table}.${col}: ${error.message}`);
    n += data?.length || 0;
  }
  return n;
}
async function totals() {
  const t = {};
  for (const table of ["profiles", "official_events", "event_tickets", "beacons", "beacon_applications", "payment_submissions", "membership_applications", "notifications"]) {
    const { count, error } = await db.from(table).select("*", { count: "exact", head: true });
    t[table] = error ? `error: ${error.message}` : count;
  }
  const { data: d } = await db.from("platform_settings").select("value").eq("key", "team_delegations").maybeSingle();
  t["platform_settings.team_delegations entries"] = (d?.value || []).length;
  return t;
}

// ── safety: verify every user in the registry is a TEST- account ──
const unsafe = [];
const authEmails = {};
for (let p = 1; p <= 50; p++) {
  const { data } = await db.auth.admin.listUsers({ page: p, perPage: 200 });
  for (const u of data?.users || []) authEmails[u.id] = u.email;
  if (!data?.users?.length || data.users.length < 200) break;
}
for (const id of userIds) {
  const { data: prof } = await db.from("profiles").select("full_name").eq("id", id).maybeSingle();
  if (!isTestEmail(authEmails[id]) && !/^TEST-/.test(prof?.full_name || "")) unsafe.push(id);
}
if (unsafe.length) {
  console.log(`ABORT: ${unsafe.length} registry user(s) are not TEST- accounts: ${unsafe.join(", ")}`);
  process.exit(1);
}

const { count: profilesTotal } = await db.from("profiles").select("*", { count: "exact", head: true });
const testProfiles = await countIn("profiles", "id", userIds);
const testAuth = userIds.filter((id) => authEmails[id]).length;

const plan = {
  "event_tickets (by id, or on TEST- events, or held by TEST- users)": (await countIn("event_tickets", "id", ids("event_ticket"))) + " listed; " +
    (await countIn("event_tickets", "event_id", eventIds)) + " on TEST- events; " + (await countIn("event_tickets", "user_id", userIds)) + " held by TEST- users",
  "payment_submissions (listed / by TEST- users)": `${await countIn("payment_submissions", "id", ids("payment_submission"))} / ${await countIn("payment_submissions", "user_id", userIds)}`,
  membership_applications: await countIn("membership_applications", "id", appIds),
  official_events: await countIn("official_events", "id", eventIds),
  "beacon_applications (listed / on TEST- beacons / by TEST- users)": `${await countIn("beacon_applications", "id", ids("beacon_application"))} / ${await countIn("beacon_applications", "beacon_id", beaconIds)} / ${await countIn("beacon_applications", "applicant_id", userIds)}`,
  "beacons (listed / hosted by TEST- users)": `${await countIn("beacons", "id", beaconIds)} / ${await countIn("beacons", "host_id", userIds)}`,
  "notifications for TEST- users": await countIn("notifications", "user_id", userIds),
  "platform_settings.team_delegations entries for TEST- users": 0,
  profiles: testProfiles,
  "auth users": testAuth,
};
const { data: deleg } = await db.from("platform_settings").select("value").eq("key", "team_delegations").maybeSingle();
const delegations = deleg?.value || [];
const testDeleg = delegations.filter((d) => userIds.includes(d.manager_user_id) || userIds.includes(d.delegator_id) || subAdminIds.includes(d.manager_user_id));
plan["platform_settings.team_delegations entries for TEST- users"] = testDeleg.length;

console.log(APPLY ? "== DELETING ==" : "== DRY RUN (nothing deleted) ==");
for (const [k, v] of Object.entries(plan)) console.log(`  ${k}: ${v}`);
console.log(`  profiles now: ${profilesTotal} total → ${profilesTotal - testProfiles} non-test would remain`);

if (!APPLY) process.exit(0);

// ── delete, children first ──
const done = {};
done.event_tickets = (await del("event_tickets", "id", ids("event_ticket"))) + (await del("event_tickets", "event_id", eventIds)) + (await del("event_tickets", "user_id", userIds));
done.payment_submissions = (await del("payment_submissions", "id", ids("payment_submission"))) + (await del("payment_submissions", "user_id", userIds));
done.membership_applications = await del("membership_applications", "id", appIds);
done.official_events = await del("official_events", "id", eventIds);
done.beacon_applications = (await del("beacon_applications", "beacon_id", beaconIds)) + (await del("beacon_applications", "applicant_id", userIds));
done.beacons = (await del("beacons", "id", beaconIds)) + (await del("beacons", "host_id", userIds));
done.notifications = await del("notifications", "user_id", userIds);
if (testDeleg.length) {
  const keep = delegations.filter((d) => !testDeleg.includes(d));
  const { error } = await db.from("platform_settings").upsert({ key: "team_delegations", value: keep, updated_at: new Date().toISOString() });
  if (error) throw new Error(`platform_settings: ${error.message}`);
}
done["team_delegations entries"] = testDeleg.length;

// storage: proof images and application photos
let files = 0;
async function rmFolder(bucket, prefix) {
  const { data } = await db.storage.from(bucket).list(prefix, { limit: 1000 });
  const paths = (data || []).filter((f) => f.name && f.id).map((f) => `${prefix}/${f.name}`);
  if (paths.length) {
    const { error } = await db.storage.from(bucket).remove(paths);
    if (!error) files += paths.length;
  }
}
for (const id of userIds) { await rmFolder("payment-proofs", `membership/${id}`); await rmFolder("payment-proofs", `tickets/${id}`); }
for (const id of appIds) { await rmFolder("payment-proofs", `applications/${id}`); await rmFolder("member-uploads", `applications/${id}`); }
done["storage files"] = files;

done.profiles = await del("profiles", "id", userIds);
let authDeleted = 0;
for (const id of userIds) {
  if (!authEmails[id]) continue;
  const { error } = await db.auth.admin.deleteUser(id);
  if (!error) authDeleted++;
  else console.log(`  auth delete failed for ${id}: ${error.message}`);
}
done["auth users"] = authDeleted;

console.log("  deleted:", JSON.stringify(done));
const after = await totals();
console.log("== counts after ==");
for (const [k, v] of Object.entries(after)) console.log(`  ${k}: ${v}`);
fs.renameSync(path.join(OUT, "test-records.json"), path.join(OUT, `test-records-deleted-${Date.now()}.json`));
