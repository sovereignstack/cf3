/* Tread unit tests — run with:  cd dev && npm test
   Loads ../index.html in jsdom and asserts the engine + storage error paths in
   isolation (smoke-test.js covers the end-to-end flow). Exits non-zero on failure. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

let passed = 0,
  failed = 0;
const ok = (cond, msg) => {
  if (cond) {
    passed++;
    console.log("  ✓ " + msg);
  } else {
    failed++;
    console.log("  ✗ " + msg);
  }
};
const near = (a, b) => Math.abs(a - b) < 1e-9;
const section = (s) => console.log("\n" + s);

const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://example.com/",
  beforeParse(w) {
    w.scrollTo = () => {};
    w.crypto = w.crypto || {};
    w.crypto.randomUUID =
      w.crypto.randomUUID || (() => "id-" + Math.random().toString(36).slice(2));
    w.matchMedia =
      w.matchMedia ||
      ((q) => ({
        matches: false,
        media: q,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
      }));
    w.URL.createObjectURL = () => "blob:mock";
    w.URL.revokeObjectURL = () => {};
    w.addEventListener("error", (e) => errors.push((e.error && e.error.stack) || e.message));
  },
});

const w = dom.window;
const store = () => JSON.parse(w.localStorage.getItem("tread") || "null");
const isoAgo = (n) => {
  const d = new w.Date();
  d.setDate(d.getDate() - n);
  return w.todayISO(d);
};

// Poll for the app script to finish initialising rather than guessing a fixed delay.
function whenReady(cb, tries = 0) {
  if (typeof w.kgFor === "function" && typeof w.recomputeProgress === "function") return cb();
  if (tries > 300) {
    console.log("\n❌ app script did not initialise (w.kgFor undefined)");
    process.exit(1);
  }
  setTimeout(() => whenReady(cb, tries + 1), 10);
}
whenReady(() => {
  try {
    section("kgFor — emission-factor maths");
    ok(near(w.kgFor("food", "redmeat", 2), 7), "2 × red-meat meals = 7 kg");
    ok(
      w.kgFor("food", "veg", 1) < w.kgFor("food", "redmeat", 1),
      "veg meal emits less than red meat",
    );
    ok(near(w.kgFor("travel", "walk", 10), 0), "walking emits nothing");
    ok(near(w.kgFor("food", "not_a_real_sub", 5), 0), "unknown sub falls back to 0 (no NaN)");
    ok(near(w.kgFor("nope", "nope", 3), 0), "unknown category falls back to 0");

    section("equiv — tangible equivalences round cleanly");
    const e = w.equiv(2.31);
    ok(e.petrol === 1 && Number.isInteger(e.petrol), "2.31 kg ≈ 1 L petrol (integer)");
    ok(Number.isInteger(w.equiv(10).km), "driving-km equivalence is an integer");

    section("baselineFrom — quiz → annual estimate");
    const b = w.baselineFrom({
      km: 20,
      mode: "car",
      diet: "mixed",
      cook: "lpg",
      shop: "some",
      bill: 1500,
      house: 3,
    });
    ok(b.total > 0, "produces a positive annual total");
    ok(
      ["travel", "food", "home", "shopping"].every((k) => typeof b.byCat[k] === "number"),
      "breaks down into all four categories",
    );
    ok(b.house >= 1, "household size is at least 1");
    const more = w.baselineFrom({
      km: 80,
      mode: "car",
      diet: "mixed",
      cook: "lpg",
      shop: "some",
      bill: 1500,
      house: 3,
    });
    ok(more.byCat.travel > b.byCat.travel, "more km ⇒ more travel emissions (monotonic)");

    section("todayISO — local date, zero-padded (not UTC)");
    ok(w.todayISO(new w.Date(2024, 0, 5)) === "2024-01-05", "Jan 5 2024 → 2024-01-05");
    ok(w.todayISO(new w.Date(2024, 11, 31)) === "2024-12-31", "Dec 31 2024 → 2024-12-31");

    section("recomputeProgress — streak logic via the public log API");
    // Fresh boot has no logs; three consecutive days ⇒ streak 3.
    w.addLog("travel", "car", 5, "km", isoAgo(0));
    w.addLog("food", "veg", 1, "meal", isoAgo(1));
    w.addLog("home", "electricity", 2, "kWh", isoAgo(2));
    ok(store().profile.streak === 3, "logs on 3 consecutive days ⇒ streak 3");
    ok(store().profile.best >= 3, "best streak is recorded");
    ok(store().profile.xp > 0, "logging awards XP");

    section("equiv & fmt — formatting edge cases");
    ok(
      w.equiv(0).km === 0 && w.equiv(0).petrol === 0,
      "equiv(0) is zero on both measures (no NaN)",
    );
    ok(w.fmt(500) === "500 kg", "fmt shows whole kg below 1 tonne");
    ok(
      w.fmt(999) === "999 kg" && w.fmt(1000) === "1 t",
      "fmt boundary: 999 kg stays kg, 1000 kg becomes tonnes",
    );
    ok(w.fmt(1500) === "1.5 t", "fmt switches to tonnes (1500 kg → 1.5 t)");

    section("topActions — ranks the user's biggest category first");
    w.addLog("travel", "car", 800, "km", isoAgo(0)); // dominate this month with travel
    const ranked = w.topActions();
    ok(
      Array.isArray(ranked) && ranked.length > 0 && ranked.every((a) => a.cat && a.id),
      "returns a ranked, well-formed action list",
    );
    ok(ranked[0].cat === "travel", "boosts an action in the dominant category (travel) to the top");
    const tw = ranked.filter((a) => a.cat === "travel");
    ok(
      tw.length < 2 || tw[0].save >= tw[1].save,
      "within a category, the larger yearly saving ranks first",
    );

    section("recomputeProgress — badges");
    w.addLog("food", "veg", 1, "meal", isoAgo(0));
    w.addLog("home", "electricity", 1, "kWh", isoAgo(0));
    w.addLog("shopping", "clothing", 1, "item", isoAgo(0));
    ok(store().badges.first_log, "first log earns the first-log badge");
    ok(store().badges.allcats, "logging all four categories earns the all-categories badge");
    for (let i = 0; i < 7; i++) w.addLog("travel", "car", 1, "km", isoAgo(i));
    ok(store().profile.streak >= 7 && store().badges.week, "a 7-day streak earns the week badge");

    section("baselineFrom — flight, cooking, household, input clamping");
    const q = {
      km: 20,
      mode: "car",
      diet: "mixed",
      cook: "lpg",
      shop: "some",
      bill: 1500,
      house: 3,
    };
    ok(
      w.baselineFrom({ ...q, flights: 2 }).byCat.travel >
        w.baselineFrom({ ...q, flights: 0 }).byCat.travel,
      "frequent flights add to travel emissions",
    );
    ok(
      w.baselineFrom({ ...q, cook: "lpg" }).byCat.home >
        w.baselineFrom({ ...q, cook: "none" }).byCat.home,
      "LPG cooking adds to home emissions",
    );
    ok(
      w.baselineFrom({ ...q, house: 6 }).byCat.home < w.baselineFrom({ ...q, house: 1 }).byCat.home,
      "a larger household divides home emissions per person",
    );
    const wild = w.baselineFrom({ ...q, km: -100, bill: -50, house: 999 });
    ok(
      wild.byCat.travel >= 0 && wild.byCat.home >= 0 && wild.total >= 0,
      "out-of-range inputs are clamped (no negative emissions)",
    );
    ok(
      w.addLog("food", "veg", -5, "meal").kg === 0 && w.addLog("food", "veg", NaN, "meal").kg === 0,
      "addLog clamps a negative/NaN quantity to 0",
    );

    section("Storage error paths are non-fatal");
    w.localStorage.setItem("tread", "{ this is : not json");
    let loaded,
      loadThrew = false;
    try {
      loaded = w.load();
    } catch {
      loadThrew = true;
    }
    ok(
      !loadThrew && loaded && typeof loaded === "object",
      "load() recovers from corrupt localStorage (returns defaults)",
    );
    const realSet = w.localStorage.setItem.bind(w.localStorage);
    w.localStorage.setItem = () => {
      throw new Error("QuotaExceeded");
    };
    let saveThrew = false;
    try {
      w.save();
    } catch {
      saveThrew = true;
    }
    w.localStorage.setItem = realSet;
    ok(!saveThrew, "save() swallows a storage-quota failure instead of crashing");

    ok(
      errors.length === 0,
      "no uncaught JS errors while loading the app" +
        (errors.length ? ":\n" + errors.join("\n") : ""),
    );

    console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed`);
    process.exit(failed === 0 ? 0 : 1);
  } catch (err) {
    console.log("\n❌ Unit test threw:", err.message);
    if (errors.length) console.log(errors.join("\n"));
    process.exit(1);
  }
});
