/* Tread smoke test — run with:  cd dev && npm install && npm test
   Loads ../index.html in jsdom, drives the real user flow, and asserts
   key invariants. Also guards the privacy guarantee (no network calls /
   no external URLs in the app). Exits non-zero on any failure. */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const HTML_PATH = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(HTML_PATH, "utf8");

let passed = 0, failed = 0;
const ok = (cond, msg) => { if (cond) { passed++; console.log("  ✓ " + msg); } else { failed++; console.log("  ✗ " + msg); } };
const section = (s) => console.log("\n" + s);

/* ---------- static source guards (privacy + leanness) ---------- */
section("Source guards");
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [, ""])[1];
ok(/<script>/.test(html), "has an inline script");
ok(!/https?:\/\//.test(html), "no external URLs anywhere in index.html");
ok(!/\bfetch\s*\(/.test(script), "app code makes no fetch() calls");
ok(!/XMLHttpRequest|sendBeacon|new WebSocket|EventSource|import\s*\(/.test(script), "no XHR / beacon / websocket / dynamic import in app code");
ok(!/prefers-color-scheme\s*:\s*dark/.test(html), "no dark-mode styles (light theme only)");
// The privacy guarantee must hold across every shipped file, not just index.html.
const swSrc = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
const manifestSrc = fs.readFileSync(path.join(__dirname, "..", "manifest.webmanifest"), "utf8");
ok(!/https?:\/\//.test(swSrc), "no external URLs in sw.js (same-origin shell caching only)");
ok(!/https?:\/\//.test(manifestSrc), "no external URLs in manifest.webmanifest");
ok((swSrc.match(/\bfetch\s*\(/g) || []).length === 1, "sw.js holds the project's single fetch() (same-origin)");

/* ---------- runtime flow ---------- */
const errors = [];
const dom = new JSDOM(html, {
  runScripts: "dangerously",
  pretendToBeVisual: true,
  url: "https://example.com/",
  beforeParse(w) {
    w.scrollTo = () => {};
    w.crypto = w.crypto || {};
    w.crypto.randomUUID = w.crypto.randomUUID || (() => "id-" + Math.random().toString(36).slice(2));
    w.matchMedia = w.matchMedia || ((q) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
    w.URL.createObjectURL = () => "blob:mock";
    w.URL.revokeObjectURL = () => {};
    w.addEventListener("error", (e) => errors.push(e.error && e.error.stack || e.message));
  }
});

const w = dom.window, d = w.document;
const $ = (s) => d.querySelector(s);
const $$ = (s) => [...d.querySelectorAll(s)];
const click = (el) => el && el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const setVal = (el, v) => { el.value = v; el.dispatchEvent(new w.Event("input", { bubbles: true })); el.dispatchEvent(new w.Event("change", { bubbles: true })); };
const store = () => JSON.parse(w.localStorage.getItem("tread") || "null");

// Poll for an explicit ready signal (welcome screen active) instead of a fixed delay — deterministic under CI load.
function whenReady(cb, tries = 0) {
  if ($("#screen-welcome") && $("#screen-welcome").classList.contains("active")) return cb();
  if (tries > 300) { console.log("\n❌ app did not boot (no #screen-welcome.active)"); process.exit(1); }
  setTimeout(() => whenReady(cb, tries + 1), 10);
}
whenReady(() => {
  try {
    section("Boot & consent");
    ok($("#screen-welcome").classList.contains("active"), "boots to the welcome/consent screen");
    ok($("#privacy-full").innerHTML.trim().length > 0, "full privacy notice is injected");
    ok($("#consent-go").disabled, "continue is disabled until consent is given");
    const cb = $("#consent-cb"); cb.checked = true; cb.dispatchEvent(new w.Event("change", { bubbles: true }));
    ok(!$("#consent-go").disabled, "continue enables after ticking consent");
    click($("#consent-go"));
    ok(store().consent && store().consent.given, "consent recorded with timestamp");

    section("Setup quiz");
    ok($("#screen-quiz").classList.contains("active"), "shows the quiz after consent");
    click(d.querySelector('#screen-quiz .opts[data-group="mode"] .opt[data-v="train"]'));
    click(d.querySelector('#screen-quiz .opts[data-group="diet"] .opt[data-v="veg"]'));
    setVal($("#q-km"), "16");
    ok($("#q-km-out").textContent === "16 km", "distance slider output updates");
    click($("#quiz-go"));
    ok($("#screen-home").classList.contains("active"), "lands on the dashboard");
    ok(store().profile.baselineAnnualKg > 0, "a baseline was computed");

    section("Dashboard (estimated state)");
    ok(/kg CO₂e/.test($("#home-dynamic").textContent), "hero shows a kg CO₂e figure");
    ok(!!$("#home-dynamic svg.donut"), "category donut renders");
    ok(/No activities yet/.test($("#home-dynamic").textContent), "recent-activity shows an empty state");
    ok(!!$("#home-demo"), "empty state offers an Add-demo-data button");

    section("Demo data");
    click($("#home-demo"));
    const demoN = store().logs.filter((l) => l.demo).length;
    ok(demoN > 100, `demo data adds many logs (${demoN})`);
    ok(store().profile.streak > 0 && store().profile.xp > 0, "demo data drives streak and points");
    ok($$("#home-dynamic [data-del]").length > 0, "recent activity now lists deletable entries");
    ok(!/estimated/.test($("#home-dynamic .label").textContent), "hero switches from estimate to tracked figure");

    section("Insights");
    click(d.querySelector('#nav [data-go="insights"]'));
    ok(!!$("#insights-dynamic svg"), "trend chart renders");
    ok($$("#insights-dynamic .bar").length > 0, "top contributors render");
    ok($$("#insights-dynamic table.sr-only").length > 0, "charts include sr-only data tables (a11y)");

    section("Log list: view, delete, undo");
    click(d.querySelector('#nav [data-go="home"]'));
    click($("#see-all-logs"));
    ok($$("#sheet-body [data-del]").length > 0, "All-activity sheet lists every entry");
    const n0 = store().logs.length;
    click($("#sheet-body [data-del]"));
    const n1 = store().logs.length;
    ok(n1 === n0 - 1, "deleting an entry removes it");
    click($("#toast-undo"));
    ok(store().logs.length === n0, "undo restores the deleted entry");

    section("Detailed entry");
    click($("#log-btn")); click($("#detailed"));
    click(d.querySelector('#catpick .opt[data-c="food"]'));
    setVal($("#d-sub"), "redmeat"); setVal($("#d-qty"), "2");
    ok(/CO₂e/.test($("#dprev").textContent), "live CO₂e preview updates");
    const before = store().logs.length; click($("#dsave"));
    ok(store().logs.length === before + 1, "detailed entry adds a log");
    ok(store().logs.find((l) => l.sub === "redmeat" && l.kg === 7), "computes 2 × red-meat = 7 kg");

    section("Accessibility: modal focus trap, Esc, live region");
    click($("#log-btn")); click($("#detailed"));
    ok($("#sheet").classList.contains("open"), "detailed-entry sheet opens as a dialog");
    const f = $$('#sheet button,#sheet input,#sheet select,#sheet [tabindex]').filter((x) => !x.disabled);
    ok(f.length > 1, "sheet exposes multiple focusable controls");
    f[f.length - 1].focus();
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    ok(d.activeElement === f[0], "Tab from the last control wraps to the first (focus trap)");
    f[0].focus();
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }));
    ok(d.activeElement === f[f.length - 1], "Shift+Tab from the first control wraps to the last");
    d.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    ok(!$("#sheet").classList.contains("open"), "Esc closes the sheet");

    section("Act / gamification");
    click(d.querySelector('#nav [data-go="act"]'));
    click($("#act-dynamic [data-pledge]"));
    ok(Object.keys(store().pledges).length > 0, "pledging records an action");
    const xpBefore = store().profile.xp;
    click($("#act-dynamic [data-done]"));
    ok(store().profile.xp > xpBefore, "marking an action done awards points");
    ok(store().badges.action1, "earns the first-action badge");

    section("Settings (accessibility)");
    click(d.querySelector('#nav [data-go="you"]'));
    setVal($("#set-size"), "xl");
    $("#set-hc").checked = true; $("#set-hc").dispatchEvent(new w.Event("change", { bubbles: true }));
    ok(/ts-xl/.test(d.documentElement.className) && /hc/.test(d.documentElement.className), "text-size and high-contrast apply");

    section("Live-region announcements");
    // live() clears #live then re-sets it on a ~30ms timer (to force re-announcement); wait for it to fire.
    $("#live").textContent = "";
    click(d.querySelector('#nav [data-go="home"]'));
    click($("#log-btn")); click($("#quicks .quick"));   // quick-log → toast → live()
    return setTimeout(() => {
      try {
        ok($("#live").textContent.trim().length > 0, "an action announces via the aria-live region (screen reader)");

        section("Privacy controls");
        let exported = false;
        const origCOU = w.URL.createObjectURL;
        w.URL.createObjectURL = (b) => { exported = true; return origCOU(b); };
        click($("#export"));
        w.URL.createObjectURL = origCOU;
        ok(exported, "export actually builds a downloadable blob (createObjectURL invoked)");
        click($("#demo-clear"));
        ok(store().logs.filter((l) => l.demo).length === 0, "remove-demo clears demo logs");
        click($("#wipe")); click($("#cyes"));
        ok(w.localStorage.getItem("tread") === null, "delete-everything erases all data");
        ok($("#screen-welcome").classList.contains("active"), "returns to welcome after erase");

        ok(errors.length === 0, "no uncaught JS errors during the whole flow" + (errors.length ? ":\n" + errors.join("\n") : ""));
        console.log(`\n${failed === 0 ? "✅ PASS" : "❌ FAIL"} — ${passed} passed, ${failed} failed`);
        process.exit(failed === 0 ? 0 : 1);
      } catch (e) {
        console.log("\n❌ Test threw (deferred):", e.message);
        if (errors.length) console.log(errors.join("\n"));
        process.exit(1);
      }
    }, 80);
  } catch (e) {
    console.log("\n❌ Test threw:", e.message);
    if (errors.length) console.log(errors.join("\n"));
    process.exit(1);
  }
});
