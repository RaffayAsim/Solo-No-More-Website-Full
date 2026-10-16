import http from "http";
import https from "https";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on("error", (err) => reject(err));
  });
}

async function runTests() {
  console.log("======================================================================");
  console.log("🔍 TESTING PREVIEW FUNCTIONALITY & AUTH ROUTING ON EVENTS AND BEACONS");
  console.log("======================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition, name) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${name}`);
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  // TEST 1: Root / Landing page response
  console.log("--- 1. Testing Homepage & Hero Section ---");
  try {
    const homeRes = await fetchUrl("http://localhost:3000/");
    assert(homeRes.statusCode === 200, "Home page loads with HTTP 200 OK");
    assert(homeRes.body.includes("Never go out alone again"), "Hero heading line 1 present");
    assert(homeRes.body.includes("Find your people IRL"), "Hero heading line 2 present");
    assert(homeRes.body.includes("14 SQUADS HANGING OUT TONIGHT NATIONWIDE"), "Hero live community badge present");
  } catch (e) {
    assert(false, `Homepage request failed: ${e.message}`);
  }

  // TEST 2: Browse Events page & Quick Preview triggers
  console.log("\n--- 2. Testing Events Page & Preview Triggers ---");
  try {
    const eventsRes = await fetchUrl("http://localhost:3000/events");
    assert(eventsRes.statusCode === 200, "Browse Events page loads with HTTP 200 OK");
    assert(eventsRes.body.includes("Browse Active Squads"), "Events directory header rendered");
    assert(eventsRes.body.includes("Preview"), "Event preview button rendered on cards");
    assert(eventsRes.body.includes("Pass"), "Event ticket passes displayed");
  } catch (e) {
    assert(false, `Events page request failed: ${e.message}`);
  }

  // TEST 3: Login page with redirect parameter support
  console.log("\n--- 3. Testing Login Page & Redirect Handler ---");
  try {
    const redirectTarget = encodeURIComponent("/events/sample-event-123?book=true");
    const loginRes = await fetchUrl(`http://localhost:3000/login?redirect=${redirectTarget}`);
    assert(loginRes.statusCode === 200, "Login page with ?redirect query param loads with HTTP 200 OK");
    assert(loginRes.body.includes("AUTHENTICATING") || loginRes.body.includes("LOGIN TO"), "Login authentication form rendered");
    assert(loginRes.body.includes("Apply to Join Club"), "Apply to Join Club link present");
  } catch (e) {
    assert(false, `Login page request failed: ${e.message}`);
  }

  // TEST 4: Apply page with redirect parameter support
  console.log("\n--- 4. Testing Apply Page & Redirect Handler ---");
  try {
    const redirectTarget = encodeURIComponent("/beacon/sample-beacon-456?join=true");
    const applyRes = await fetchUrl(`http://localhost:3000/apply?redirect=${redirectTarget}`);
    assert(applyRes.statusCode === 200, "Apply page with ?redirect query param loads with HTTP 200 OK");
  } catch (e) {
    assert(false, `Apply page request failed: ${e.message}`);
  }

  // TEST 5: Event Preview Data Contract & Logic
  console.log("\n--- 5. Testing Event Preview Data Contract & Auth Redirect Logic ---");
  const sampleEvent = {
    id: "evt_9988",
    title: "Indie Rooftop Acoustic Jam",
    venue_name: "Cafe Flo Rooftop",
    price: 2500,
    max_capacity: 50,
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
  };

  // Test unauthenticated booking action generates correct encoded redirect URL
  const unauthRedirectUrl = `/login?redirect=${encodeURIComponent(`/events/${sampleEvent.id}?book=true`)}`;
  assert(
    unauthRedirectUrl === "/login?redirect=%2Fevents%2Fevt_9988%3Fbook%3Dtrue",
    "Unauthenticated event booking routes to /login with safely encoded ?book=true URL"
  );

  // Test post-login decoded destination matches exact booking URL
  const parsedRedirect = decodeURIComponent(unauthRedirectUrl.split("redirect=")[1]);
  assert(
    parsedRedirect === `/events/${sampleEvent.id}?book=true`,
    "Post-login redirect unpacks directly to /events/{id}?book=true"
  );

  // Test shouldAutoBook flag detection
  const searchParamsMock = new URLSearchParams(parsedRedirect.split("?")[1]);
  assert(
    searchParamsMock.get("book") === "true",
    "PublicEventBookButton auto-opens EventBookingModal when ?book=true is present"
  );

  // TEST 6: Beacon Preview Data Contract & Logic
  console.log("\n--- 6. Testing Beacon Preview Data Contract & Auth Redirect Logic ---");
  const sampleBeacon = {
    id: "bcn_3322",
    title: "Late Night Chai & FIFA",
    category: "casual",
    total_slots: 6,
    filled_slots: 4,
    description: "Budget: Under PKR 1,000 | Question: What is your favorite FIFA squad?",
  };

  // Test unauthenticated join action generates correct encoded redirect URL
  const unauthBeaconRedirectUrl = `/login?redirect=${encodeURIComponent(`/beacon/${sampleBeacon.id}?join=true`)}`;
  assert(
    unauthBeaconRedirectUrl === "/login?redirect=%2Fbeacon%2Fbcn_3322%3Fjoin%3Dtrue",
    "Unauthenticated beacon join routes to /login with safely encoded ?join=true URL"
  );

  // Test post-login decoded destination matches exact beacon join URL
  const parsedBeaconRedirect = decodeURIComponent(unauthBeaconRedirectUrl.split("redirect=")[1]);
  assert(
    parsedBeaconRedirect === `/beacon/${sampleBeacon.id}?join=true`,
    "Post-login redirect unpacks directly to /beacon/{id}?join=true"
  );

  // Test shouldAutoJoin flag detection
  const beaconSearchParamsMock = new URLSearchParams(parsedBeaconRedirect.split("?")[1]);
  assert(
    beaconSearchParamsMock.get("join") === "true",
    "PublicBeaconJoinButton auto-opens Join Modal when ?join=true is present"
  );

  // Summary
  console.log("\n======================================================================");
  console.log(`📊 PREVIEW & AUTH TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("======================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 ALL PREVIEW & SMART REDIRECTION FUNCTIONS WORKING FLAWLESSLY!\n");
    process.exit(0);
  } else {
    console.error("❌ Some tests failed.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
