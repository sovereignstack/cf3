# dev/ — tooling (not deployed)

Nothing in this folder ships to users. Deploy only the static files in the project root
(`index.html`, `manifest.webmanifest`, `sw.js`, `icon-*.png`).

## Tests
`npm test` runs two suites against `../index.html` in jsdom:

- **`unit-test.js`** — isolated assertions on the engine (`kgFor`, `baselineFrom`, `equiv` rounding,
  `recomputeProgress` streak/forgiving logic) and the storage error paths (corrupt `localStorage`,
  `setItem` quota failure, future-date handling).
- **`smoke-test.js`** — drives the full user flow (consent → quiz → log → demo data → delete/undo →
  insights → settings → pledge → erase) and guards the privacy invariant (no network calls / no
  external URLs in the app).

```bash
cd dev
npm install      # installs jsdom (dev-only)
npm test         # runs unit-test.js then smoke-test.js
npm run check    # quick syntax check of the inline script
```

Run `npm test` after every change. See `../CLAUDE.md` for the definition of done.

## Icons
`make_icons.py` regenerates `icon-64/192/512.png` (a white leaf on deep green) with Pillow:

```bash
python3 make_icons.py        # writes icon-64/192/512.png into the repo root automatically
```
