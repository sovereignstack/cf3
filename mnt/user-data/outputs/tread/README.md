# Tread

**See your carbon. Shrink it, simply.**

Tread is a small web app that helps one person understand, track, and reduce their carbon footprint through quick daily logging and personalised, high-impact actions. It is built India-first (₹, LPG, local trains, two-wheelers, the Indian grid factor), it works fully offline, and — by design — none of your data ever leaves your device.

It is a single HTML file with no framework, no build step, no dependencies, and no network calls. You can read the whole thing top to bottom, and you can verify every claim below by reading the source.

---

## Run it / deploy it

The app is just static files, so any static host works and deployment takes about two minutes. A service worker powers the offline features, and service workers require **HTTPS or `localhost`** — so use one of the hosts below (all give you HTTPS) or `localhost` rather than opening the file directly with `file://`.

**Fastest public link (no account needed):**
- **Netlify Drop** — go to <https://app.netlify.com/drop> and drag the project folder in. You get an HTTPS link immediately.
- **Surge** — from inside the folder: `npx surge` → follow the prompt → instant link.

**Common for hackathons:**
- **GitHub Pages** — push the folder to a repo, then *Settings → Pages → Deploy from branch → `main` / root*. Your link will be `https://<user>.github.io/<repo>/`. (All paths in the app are relative, so it works fine in a subfolder like this.)
- **Vercel** — `npx vercel` in the folder, or import the repo at vercel.com.
- **Cloudflare Pages** — connect the repo, framework preset *None*, output directory `/`.

**Run locally (for testing):**
```bash
# any one of these, from the project folder:
python3 -m http.server 8000      # then open http://localhost:8000
npx serve                        # then open the printed http://localhost:… URL
```

There is **no login and no account** — the app opens straight to a one-time welcome where you give consent on-device (a single checkbox), then it's immediately usable. This keeps it reachable from a plain link for automated and manual evaluation alike.

---

## What it does

Good carbon apps share a simple spine, and Tread follows it deliberately: **see your footprint → act on it → track your progress.**

- **See.** A six-tap setup estimates your starting footprint and breaks it down across travel, food, home energy, and shopping. The number is always translated into something tangible (kilometres of driving, litres of petrol, trees) because "kg of CO₂e" means very little on its own.
- **Act.** Suggested actions are ranked by impact *for you* — the app looks at your biggest category and surfaces the changes that matter most there, each tagged with effort and an estimated yearly saving. You can pledge an action and mark it done.
- **Track.** Quick-log presets (a train commute, a veg meal, a two-wheeler trip) record an activity in one tap, with the CO₂e shown instantly. A dashboard tracks the month, a trend builds over time, and progress is measured first against **your own past self**, then against benchmarks.

Two research-backed principles shape the tone throughout:

- **No guilt.** Carbon is framed as a challenge to beat, never a moral failing. Increases are reported in calm, neutral language (amber, never red) with a constructive next step — because guilt and anxiety are among the most common reasons people abandon these apps.
- **Honest about accuracy.** Every figure is an estimate, and the app says so plainly, with the methodology one tap away. The goal is to be trustworthy, not to imply false precision.

---

## Why it's built this way

The interesting decisions here are architectural, and each one does double or triple duty.

### One file, no dependencies, no build step

The entire application is a single `index.html` — structure, styles, and logic — written in plain vanilla JavaScript. There is no React, no bundler, no `node_modules`, no CDN, and nothing to compile. This is a deliberate choice, not a shortcut:

- **It's auditable.** Anyone evaluating the app — human or automated — can read the complete source in one sitting and see exactly what it does. There is no hidden dependency tree to take on trust.
- **It's lean.** Fewer lines and zero third-party code mean a smaller surface for bugs and a smaller surface for security issues. Nothing ships that isn't used.
- **It deploys anywhere.** Static files drop onto any host with no build pipeline to break.

### Local-first: privacy and offline from a single decision

All of your data lives in your browser's local storage, on your device. There is no server and no account. That one architectural choice resolves three requirements at once:

- **Privacy** becomes the default rather than a policy promise — data that is never collected centrally cannot be leaked, sold, or profiled.
- **Offline** becomes the normal case rather than a degraded mode — if the data and the app are both on the device, connectivity is irrelevant.
- **Open access** becomes possible — with no accounts to manage, the app can sit behind a public link for evaluation without a login wall.

---

## Privacy and data protection (GDPR + DPDP)

Privacy here is structural. The strongest way to protect personal data is to never transmit it, and that is the design.

**What this means concretely:**

- **No account, no server, no analytics, no advertising, no third-party scripts, no trackers.** Your setup answers, activity logs, pledges, and settings are stored only in this browser, on this device.
- **No data egress.** The application makes **no network requests for your data** — none. There are no external URLs anywhere in the code. The only `fetch` in the project lives in the service worker, and it only ever requests the app's *own* static files (same-origin) to make them available offline. You can confirm this yourself: search the source for `fetch(` or `http`. The application code has neither.

**Consent (DPDP Act 2023, §6 / GDPR Art. 6 & 7).** Before any data is entered, the app shows a plain-language, itemised notice — what is stored, why, where it lives, and how to remove it — and requires a **clear affirmative action** via an **unticked** checkbox. There are no pre-ticked boxes, no bundled consent, and no dark patterns. Because nothing is shared and there is no optional processing, consent is genuinely unbundled. The consent version and timestamp are recorded locally for your own transparency.

**Your rights, all built in and instant** (because the data is local):

| Right | How Tread honours it |
| --- | --- |
| Access (DPDP §11 / GDPR Art. 15) | "View what's stored" shows the complete raw data; "Export my data" downloads it. |
| Portability (GDPR Art. 20) | One-tap export to a human-readable JSON file. |
| Correction (DPDP §12 / GDPR Art. 16) | Edit or delete any individual log; redo your setup any time. |
| Erasure (DPDP §12 / GDPR Art. 17) | "Delete everything" wipes all local data permanently, after a clear confirmation. |
| Withdraw consent (DPDP §6(4) / GDPR Art. 7(3)) | One tap — and it's as easy to withdraw as it was to give, with immediate erasure. |

**A deliberate judgment call on scope.** The DPDP framework places heavy obligations on *Data Fiduciaries* that process personal data at scale — for example, serving consent notices across all 22 scheduled languages and integrating with registered Consent Managers (which themselves require a corporate presence and a minimum net worth). Those obligations are designed for organisations that collect and hold people's data on servers. Tread holds nothing, transmits nothing, and operates no backend, so that machinery is not triggered. Building it anyway would have added significant code and complexity for no real protection — and more code is more to get wrong. The honest, proportionate response for a no-egress, on-device tool is what's implemented here: a clear notice, real consent, and instant, total user control. (The privacy notice does note multi-language availability as the right next step if this were ever to grow into a hosted service.)

A full plain-language policy ships alongside the app in [`PRIVACY.md`](PRIVACY.md), and the same notice is readable inside the app before consent and from the *You* tab.

---

## Works offline (Progressive Web App)

Tread is a installable PWA designed offline-first.

- **Installable.** It ships a web app manifest with maskable icons, a theme colour, and standalone display, so it can be added to a phone's home screen and launched like a native app.
- **Fully usable offline.** A service worker precaches the entire app shell on first visit. After that, everything — setup, logging, the dashboard, insights, actions, and the methodology — works with no connection at all. This matters for the target user: logging a commute on the metro, underground, with no signal, should just work.
- **No spinner can hang.** Because there are no network dependencies in the core flows, nothing waits on connectivity. A calm "Works offline" indicator reassures rather than warns, and the service worker registration is wrapped so that even if it fails, the app still runs.
- **Safe updates.** A new service worker version cleans up old caches on activation, so the app updates without leaving stale files behind.

---

## Accessibility (WCAG 2.2 AA)

Accessibility was treated as a baseline, not a feature, and built in from the start.

- **Contrast.** The palette is chosen for legibility — primary text sits around 14:1 on the background, and the green used for primary actions clears the 4.5:1 AA threshold. A **high-contrast** mode is available in settings for users who need more.
- **Never colour alone.** Category and trend information always pairs colour with a text label and a value. Every chart is accompanied by a visually-hidden data table carrying the same numbers, and each chart has an ARIA summary — so the donut and bars are fully meaningful to a screen reader and to anyone with colour-vision differences.
- **Keyboard and focus.** Every control is reachable and operable by keyboard, the tab order is logical, and there is a clear, high-contrast focus ring on everything focusable. A "skip to content" link is provided. The log sheet is a proper modal dialog with a focus trap and `Escape` to close.
- **Adjustable text.** A text-size control (small → extra large) scales the whole interface, and the layout reflows to a single comfortable column.
- **Motion.** Animations respect the operating system's "reduce motion" setting, and a manual toggle is provided as well.
- **Semantics.** Real landmarks, headings, buttons, labelled inputs, and an `aria-live` region that announces newly logged amounts and live calculations.

---

## How the numbers work

Every estimate uses the same transparent formula:

```
emissions (kg CO₂e) = activity amount × emission factor
```

The app uses **activity-based** factors rather than spend-based ones on purpose: a ₹500 shirt and a ₹5,000 shirt have a similar physical footprint, so estimating carbon from money paid would unfairly penalise buying better-made goods. Activity data (kilometres, kilowatt-hours, meals) is the honest basis.

**India-first factors** (stored as plain data, easy to inspect and adjust; all are published averages and therefore estimates):

- Electricity ≈ **0.71 kg CO₂e/kWh** (CEA national grid average)
- LPG ≈ **2.98 kg CO₂e/kg**
- Travel, per km: two-wheeler 0.06 · auto-rickshaw 0.10 · bus 0.10 · car 0.17 · train/metro 0.04 · flight ≈ 0.25 (including a multiplier for aviation's extra high-altitude warming)
- Food, per meal: vegan 0.7 · vegetarian 1.0 · fish 1.3 · chicken 1.6 · red meat 3.5

**Benchmarks** are India-calibrated, because comparing an Indian user to a global or Western average is both inaccurate and discouraging: India's per-capita footprint is roughly 1.9 t/year against a global average near 4.7 t/year. Your own past self is always the primary comparison.

**Sources** include the CEA CO₂ Baseline Database for India's grid, Poore & Nemecek (2018) for food life-cycle figures, and standard per-kilometre transport factors. The in-app *About* screen states plainly: these are estimates — use the trend and the relative sizes, not the exact decimals.

---

## What the research informed — and what was left out

This build drew on market and methodology research, including a detailed external research document. The useful parts were kept and the rest was set aside on purpose:

**Kept:** the see → act → track structure; the emphasis on tangible equivalences and a no-guilt tone; activity-based (not spend-based) estimation; an accessibility-audited light palette; SVG charts (whose elements can carry ARIA labels) over canvas; and per-chart data-table fallbacks.

**Set aside, with reasons:**
- **Server sync, background sync, and conflict-resolution strategies** — these assume a backend. Tread is intentionally serverless and local-first, which is simpler and more private; there is nothing to sync and nothing to reconcile.
- **Bank-account and GPS auto-tracking** — high privacy cost, and spend-based numbers are easily distorted by prices. Manual logging is more honest and keeps the data on-device. (The code keeps a clean seam where automatic sources could be added later without touching the engine.)
- **The full Data-Fiduciary apparatus** (22-language consent, Consent-Manager integration) — not triggered by a no-egress, on-device app, and adding it would have meant a lot of code protecting against risks this design doesn't create.
- **US-centric units and factors** (gallons, MPG, pounds) — replaced throughout with India-first units and factors.

Including the reasoning here because the omissions were choices, and the judgment behind them is part of the work.

---

## Honest limitations

- Data lives in one browser on one device. That's the privacy model, but it also means there's no cross-device sync; the JSON export/import is the intended way to move or back up data.
- Emission factors are population averages, so individual reality varies — the app is a guide to direction and relative scale, not an audit.
- It's English-only at present (the interface is structured so copy could be localised).
- The setup quiz trades some precision for speed; detailed logging is where accuracy improves over time.

---

## Project structure

```
index.html             The entire app: HTML, CSS, and vanilla JS (no dependencies)
manifest.webmanifest   PWA manifest (installable, maskable icons, theme)
sw.js                  Service worker: precaches the shell, serves offline
icon-192.png           App icons
icon-512.png
icon-64.png
PRIVACY.md             Full plain-language privacy policy
README.md              This file
```

---

## Notes for reviewing the build

A few things are quick to verify and speak to the care taken:

- **No network calls for data:** search `index.html` for `fetch(`, `XMLHttpRequest`, or `http` — there are none. The single `fetch` in `sw.js` only caches the app's own files.
- **No dependencies:** there is no `package.json` shipped and nothing to install; the app runs as-is.
- **Accessibility:** tab through the whole app by keyboard; turn on a screen reader and confirm the charts read out via their data tables; try the high-contrast and text-size settings.
- **Offline:** load it once on a host or `localhost`, then go offline and confirm everything still works, including logging.
- **Your data is yours:** use *View what's stored*, *Export*, and *Delete everything* in the *You* tab.

Tread is meant to be a calm, honest, private way to tread a little more lightly — small enough to trust, and complete enough to use every day.
