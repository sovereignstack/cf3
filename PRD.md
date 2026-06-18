# Tread — Product Requirements Document

**Status:** working MVP, deployable. This PRD reflects what is *actually built* and lays out what comes next. It supersedes any earlier pre-build specification (which assumed a React/IndexedDB stack); the shipped app is intentionally a single-file vanilla-JS PWA — see `CLAUDE.md` for the engineering rationale.

**Tagline:** See your carbon. Shrink it, simply.

---

## 1. Problem & vision

Individuals want to act on climate but can't connect the abstract goal to daily choices. The prompt: *help individuals understand, track, and reduce their carbon footprint through simple actions and personalised insights.*

Tread's bet is that behaviour change comes from a tight loop — **see → act → track** — delivered without guilt, with honest estimates, and with zero friction (including zero connectivity and zero privacy cost). It is calibrated for India first, where per-capita footprints (~1.9 t/yr) and daily life (two-wheelers, local trains, LPG, ₹ electricity bills) differ sharply from the Western defaults most apps assume.

---

## 2. Target users

- **Primary — "Curious Reducer"** (urban Indian, ~25–40): climate-aware, commutes by train/two-wheeler/car, pays an electricity bill and books LPG, privacy-conscious, motivated by visible progress. Often offline (metro, basements).
- **Secondary — "Motivated Optimiser"** (student/young professional): wants quick, gamified, daily engagement.
- **Always supported — accessibility-dependent users:** screen-reader and large-text users must be able to do everything.

---

## 3. Principles (non-negotiable)

1. **No guilt.** Framed as a challenge, never a moral failing. Increases are neutral/amber, never red.
2. **Make it tangible.** Always translate kg CO₂e into km driven, litres of petrol, or trees.
3. **Low-friction logging.** One-tap presets; sensible defaults; an estimate path.
4. **Surface the big levers first** (travel, flights, diet, home energy) for *this* user.
5. **Honest about accuracy.** Everything is an estimate and says so; methodology is one tap away.
6. **Progress over perfection.** Compare to your past self first; benchmarks are context.
7. **Private by default.** Data stays on the device; the user owns and can erase it instantly.
8. **Works offline.** Full functionality with no connection.

---

## 4. Architecture (as built)

- **Single-file vanilla-JS PWA.** `index.html` contains all HTML/CSS/JS. No framework, no build, no dependencies, no CDN.
- **Local-only storage.** All state in `localStorage` under one key (`tread`). No server, no account, no login.
- **Offline-first.** A service worker (`sw.js`) precaches the app shell; everything works offline. The app makes **no network calls for user data** and contains **no external URLs**.
- **Light theme only**, with an accessible high-contrast variant.
- See `CLAUDE.md` for full conventions, state shape, and constraints.

This architecture is itself a product decision: it delivers privacy, offline, and open (login-free) access from one design, and keeps the codebase small enough to audit and trust.

---

## 5. Feature inventory (built)

Each item notes its acceptance state.

### Onboarding & consent
- **First-run consent** — plain-language, itemised privacy notice; unticked checkbox; clear affirmative action recorded with timestamp. No account. ✅
- **Setup quiz** — six taps (travel mode + daily km, flights, diet, electricity bill ₹, cooking fuel, household size, shopping) → annual baseline by category. Includes a "skip → typical estimate" path. ✅

### Track
- **Quick log** — preset chips (train, two-wheeler, car, auto, veg/chicken/red-meat meal, electricity, LPG, walk) log in one tap with instant CO₂e + undo. ✅
- **Detailed log** — pick category → activity → amount, with a live CO₂e preview and validation. ✅
- **Recent activity list** — Home shows recent entries; "See all" opens the full history grouped by date; **every entry is individually deletable, with undo.** ✅ *(added after first build)*
- **Offline logging** — works with no connection. ✅

### Understand
- **Dashboard** — month total, change vs past self / start, tangible equivalence, budget bar to the 1.5 °C target, category donut, gamification strip, best-next-action. ✅
- **Insights** — 6-month trend (SVG), top contributors, comparison (you / past self / India avg / target), "what changed". ✅
- Every chart has an `sr-only` data-table fallback and ARIA summary. ✅

### Reduce (gamified)
- **Personalised actions** — ranked by the user's biggest category; effort + estimated yearly saving; pledge and mark-done. ✅
- **XP, levels, streak, badges** — all derived consistently from logged data + pledges via `recomputeProgress()`. Forgiving streak. ✅

### Privacy & control
- **Privacy centre** — export all data (JSON), view exactly what's stored, withdraw consent, delete everything. Instant, because data is local. ✅

### Accessibility
- Keyboard operability, visible focus, modal focus trap, `aria-live` updates, text-size (S–XL), high-contrast, reduce-motion; colour never the sole signal. ✅

### Platform
- **Installable PWA** — manifest with maskable icons, theme colour, standalone display. ✅
- **Offline** — service worker precache + offline navigation fallback; calm offline indicator. ✅

### Demo / testing
- **Demo data** — one tap fills ~two months of realistic sample activity (and one flight) so charts, trends, contributors and streak are populated for a demo; clearly marked `demo`, removable in one tap. ✅ *(added after first build)*

---

## 6. Roadmap / backlog

Prioritised. Each item should ship without violating the Hard constraints in `CLAUDE.md` (no deps, no backend, light-only, accessible, no-guilt, lean).

### P1 — high value, low risk
- **Edit an existing log** (not just delete) — tap an entry to adjust amount/type. Acceptance: editing recomputes totals and progress; keyboard-accessible; undo.
- **Personal reduction goal** — let the user set a target (% or absolute) with a progress ring; compare to past self. Acceptance: goal persists; Home shows progress; honest framing.
- **Backdate a log** — date picker in detailed entry so users can fill yesterday. Acceptance: date defaults to today; can't pick the future; trend/streak update correctly.
- **Data import** — restore from an exported JSON file (round-trips with export). Acceptance: validates shape; merges or replaces with confirmation; never silently corrupts state.

### P2 — engagement & depth
- **Time-boxed challenges** (e.g. "meat-free week", "car-free 3 days") with a badge on completion.
- **Per-category detail screen** — tap a contributor to see its logs and a matching action.
- **Opt-in local reminders** (Notification API) — strictly opt-in, off by default, no spam.
- **"Typical day" template** — one tap to log a recurring routine.

### P3 — reach (only if it doesn't compromise the constraints)
- **Locale switch** — a `GLOBAL` factor set + currency/units, keeping India as default. Multi-language UI copy (the interface is structured for it).
- **Richer methodology view** — expose the full factor table with sources inside the app.
- **Extensibility seams for auto-sources** — the data model already isolates logging; a future GPS/spend importer could feed the same pipeline *without* changing the engine. (Would require a careful, opt-in privacy review; not a near-term goal.)

### Explicit non-goals
- No bank/UPI or GPS auto-tracking in the core product (privacy cost; spend-based numbers distort).
- No social feed / leaderboards (privacy + anxiety).
- No cloud sync / multi-device accounts (contradicts local-first; export/import covers backup).
- No carbon-offset purchasing/payments.
- No dark mode.

---

## 7. Carbon methodology

`emissions (kg CO₂e) = activity amount × emission factor`, using **activity-based** factors (not spend-based, which would penalise buying better goods). India-first values (estimates; stored as data in `index.html`): electricity ≈ 0.71 kg/kWh (CEA), LPG ≈ 2.98 kg/kg, transport per km (two-wheeler 0.06 / auto 0.10 / bus 0.10 / car 0.17 / rail 0.04 / flight ≈ 0.25 incl. radiative forcing), food per meal (vegan 0.7 / veg 1.0 / fish 1.3 / chicken 1.6 / red meat 3.5). Benchmarks are India-calibrated. Sources: CEA CO₂ Baseline Database, Poore & Nemecek (2018), standard per-km transport factors. The app states plainly that figures are estimates — use trend and relative size, not exact decimals.

---

## 8. Compliance & privacy requirements

- **Consent** before any data entry, via clear affirmative action; no pre-ticked boxes, no bundling, no dark patterns (DPDP Act 2023; GDPR Art. 6/7).
- **Rights**: access, portability, correction, erasure, withdrawal — all implemented and instant because data is local.
- **Data minimisation & no egress**: collect only what's needed; transmit nothing; no analytics/trackers/ads.
- The heavy Data-Fiduciary apparatus (multi-language consent at scale, Consent-Manager integration) is **not triggered** by a no-egress, on-device app and is intentionally out of scope; the privacy notice flags multi-language as the right step *if* this ever becomes a hosted service. See `PRIVACY.md`.

---

## 9. Accessibility requirements

Target **WCAG 2.2 AA** as a baseline: text contrast ≥ 4.5:1 (high-contrast mode available); colour never the sole signal; all charts have data-table fallbacks; full keyboard operability with visible focus; modal focus trap; labelled inputs with linked errors; `aria-live` for live results; adjustable text size; reduced-motion respected. Regressions here are bugs, not nice-to-haves.

---

## 10. Success criteria

- A new user reaches a personalised footprint in under ~2 minutes, logs an activity in one tap, and sees a concrete next action.
- The app loads and works **fully offline** after first visit, and is **installable**.
- A reviewer can confirm, from the source, that **no personal data leaves the device**.
- The whole experience is operable by keyboard and screen reader.
- The codebase stays small, dependency-free, and easy to audit.
