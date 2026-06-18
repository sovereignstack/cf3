# dev/ — tooling (not deployed)

Nothing in this folder ships to users. Deploy only the static files in the project root
(`index.html`, `manifest.webmanifest`, `sw.js`, `icon-*.png`).

## Smoke test
Loads `../index.html` in jsdom and drives the full user flow (consent → quiz → log →
demo data → delete/undo → insights → settings → pledge → erase), and guards the privacy
invariant (no network calls / no external URLs in the app).

```bash
cd dev
npm install      # installs jsdom (dev-only)
npm test         # runs smoke-test.js
npm run check    # quick syntax check of the inline script
```

Run `npm test` after every change. See `../CLAUDE.md` for the definition of done.

## Icons
`make_icons.py` regenerates `icon-64/192/512.png` (a white leaf on deep green) with Pillow:

```bash
python3 make_icons.py        # writes icon-*.png into THIS folder; copy them to the project root
```
