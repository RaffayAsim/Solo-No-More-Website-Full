# Known issues

## React error #310 when a host opens a beacon (`/dashboard/beacon/<id>` → `/dashboard/chats`)

**What happens.** Intermittently, the browser logs
`Minified React error #310` ("Rendered more hooks than during the previous render") while a beacon
host opens `/dashboard/beacon/<id>`. For the host, that page redirects to
`/dashboard/chats?beaconId=<id>`. The page keeps working afterwards; approving applicants,
withdrawing and chat all still function.

**How often.** It appeared in about 1 of every 3 runs of `scripts/e2e/d-beacons.mjs`
(4 times in roughly 12 runs, November 2026). It was reproduced once in `next dev`, where the
message was "Rendered more hooks than during the previous render", right after the
`getUnreadCount()` server action, during the redirect from the beacon page to the chats page.

**What was ruled out.** A scan of every client component in `app/` and `components/` found:
- no hook called after an early `return`
- no hook called inside a condition or loop
- no component called as a plain function (`{Row()}`)

`ChatsDashboardClient.tsx` and `BeaconSquadHubClient.tsx` call all their hooks unconditionally at
the top of the component. The full component stack could not be captured, because the dev server
ran out of memory on the test machine (5.8 GB RAM).

**How to locate it.** Either way works:
1. **Run the dev build on a machine with more memory** (8 GB or more free). Run `npm run dev`,
   log in as a beacon host, open `/dashboard/beacon/<id>` a few times and click the **Squad** tab.
   The dev overlay and console show the full error with the component stack.
2. **Use source maps on a preview build.** Temporarily set `productionBrowserSourceMaps: true` in
   `next.config.ts`, deploy a Vercel *preview* (not production), reproduce the error, and read the
   stack in the browser devtools, which map minified frames back to the source files. Remove the
   flag afterwards.
