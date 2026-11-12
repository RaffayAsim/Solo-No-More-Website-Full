// Runs every e2e flow in order and prints only the summary line of each (plus any FAIL lines).
//
// Before running:
//   1. npm run build
//   2. Start the server with the email send log enabled (PowerShell):
//        $env:E2E_EMAIL_LOG="1"; npx next start -p 3000 *> scripts/e2e/.output/server.log
//      (Git Bash: E2E_EMAIL_LOG=1 npx next start -p 3000 > scripts/e2e/.output/server.log 2>&1)
//   3. node scripts/e2e/00-create-test-admin.mjs   (once; stores a TEST- admin login in .env.local)
//   4. node scripts/e2e/run-all.mjs
//
// Every record the scripts create is prefixed "TEST-" and listed in scripts/e2e/.output/test-records.json.
// E2E_BASE_URL can point the scripts at another server (do NOT use it against production).
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const flows = [
  "f-upgrade-hub.mjs", // 0 + F
  "a-membership.mjs",
  "b-event-ticket.mjs",
  "c-door-scanner.mjs", // uses state from B
  "d-beacons.mjs",
  "e-permissions.mjs", // uses state from B
  "g-contact.mjs",
  "h-session.mjs",
  "i-expiry.mjs",
  "j-uploads.mjs",
];
let failed = 0;
for (const f of flows) {
  const r = spawnSync(process.execPath, [path.join(here, f)], { encoding: "utf8", env: process.env, timeout: 15 * 60 * 1000 });
  const out = `${r.stdout || ""}${r.stderr || ""}`;
  for (const line of out.split(/\r?\n/)) if (/^(FAIL|==)|screenshot:/.test(line)) console.log(line);
  if (r.status !== 0) failed++;
}
console.log(failed ? `\n${failed} flow(s) had failures` : "\nALL FLOWS PASS");
process.exitCode = failed ? 1 : 0;
