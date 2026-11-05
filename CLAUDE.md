# Koala Tower (ATC Trainer)

A free, mobile-first practice app for the Airservices Australia air traffic controller selection tests. Built for one candidate's own prep, so it should be fast, simple and fun, with no backend.

## Context: what the real tests are
Airservices Australia uses the **SureSelect** test battery (by Airways International / Airways NZ). The online stage has three suites:

1. **ATC Skill Simulations** (~1.5 h, gamified): short-term memory, spatial awareness, remembering relationships, radar simulation (safety, efficiency, multi-tasking).
2. **ATC Cognitive Ability Suite** (~45 min): detail accuracy (~15 min) and coded reasoning (~30 min).
3. **Behavioural Traits** questionnaire (personality; not something to drill).

None of them needs aviation knowledge. Practice should look and feel like these tasks, with mental maths and number puzzles as supporting work.

## Current state
- Static site, no build step, no dependencies. `index.html` loads `css/app.css` and classic `<script>` files (not ES modules, so it still opens straight from `file://`).
- **World** (`js/world.js`): a canvas you fly around.
  - Map view: top-down, steer by heading (⟲ ⟳ buttons, tap the map, arrow keys, or AUTO). Heading tape, minimap, golden rings (+XP), and "Koala Tower" giving real headings to the suggested lesson area. Fly into an airport's dashed circle to open its lessons.
  - Side view: pitch up/down through gates at given flight levels; HUD shows pitch, V/S, FL, and the 1-in-60 angle needed.
  - Islands: Koala Tower HQ (daily flight, checkride) plus one per area.
- **Areas and drills** (each drill has 10 levels; a ★ unlocks the next):
  - Maths Meadows (`drills/maths.js`): arithmetic, unit conversions, speed/distance/time, quick estimates, percentages & fractions.
  - Puzzle Peaks (`drills/puzzles.js`): number series, number machines, missing operators, symbol sums, odd one out.
  - Spatial Sands (`drills/spatial.js`): heading turns, clock-code traffic, map bearings (rotated maps from L6), mental rotation, path tracking, point the way.
  - Memory Mountains (`drills/memory.js`): digit span, flight strip recall, n-back, blip grid, remembering relationships.
  - Detail Docks (`drills/detail.js`): same or different, spot the differences (tables), scan & count.
  - Code Canyon (`drills/coded.js`): code book, rule follower, symbol operations, code breaker (+ letter series).
  - Radar Reef (`drills/radar.js`): conflict spotter, sector control (live radar sim), multi-tasking.
- **Runner** (`js/runner.js`): timed rounds (setting: 60/90/120/180 s, star targets scale) or fixed-trial rounds; question types `num`, `hdg` (mod 360), `text`, `choice` (incl. `layout:'compass'`), `tap` (toggle `[data-t]` elements); optional `study` phase (`html` + ms, or flashed `frames`). Custom drills get a `ctx` (stage, loop, countdown, finish). Results show stars, XP, unlocks and a review of misses. `A.session()` chains legs (daily flight, checkride).
- **Progress** (`js/core.js`): one localStorage key `atctrainer:v2` with XP, ranks (Student Pilot → Chief of the Skies; plane colour changes), per-drill stars/unlocks/best, history (300 runs), streak, settings.
- **Screens** (`js/screens.js`): region & drill sheets, HQ (daily flight from weakest areas; checkride in SureSelect order at L3/L6/L9), logbook, profile (14-day chart, area progress, history), settings (round length, sound, vibration, radar helpers, unlock all, reset).

## Hosting, SEO and security
- Live at **https://koalatower.app** via Cloudflare Pages (no build command, output directory `/`). Domain registered at name.com; DNS on Cloudflare.
- `js/config.js` holds the site URL and the optional `tipUrl` / `feedbackUrl` (hidden when empty; only `https://` links are shown).
- SEO: meta/OG/Twitter tags and JSON-LD in `index.html`, a crawlable content page `about.html`, `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, icons and share image in `assets/` (regenerate PNGs with Playwright if the design changes). If the domain changes, update every `koalatower.app` reference.
- Visitor counts: Cloudflare Web Analytics (cookieless), switched on in the Cloudflare dashboard, not in code.
- Security: `_headers` sets a strict CSP (own files + Cloudflare analytics only), nosniff, frame-deny, etc. Keep it working: **no inline scripts or `on*=` attributes, no third-party scripts**, set handlers in JS. Feedback goes to an external form; never add a backend or a field that posts or displays other users' text. Escape anything user-typed with `u.esc` before putting it in HTML.

## Adding a drill
Call `A.drill({ id, area, name, icon, desc, tips, gen(L, st) | run(ctx), target(L) | trials, accFloor? })` in the area's file. `gen` returns a question object; `st` is per-round state. Make every level 1–10 valid; harder levels should be genuinely harder.

## Conventions
- Keep it a static page that works from `file://` and GitHub Pages. No bundler, no frameworks.
- Mobile first (about 390 px wide), dark theme, cute (emoji, pastel accents, Koala Tower), big tap targets, `inputmode="decimal"` for numeric answers. Avoid typed negative answers (iOS decimal keypad has no minus).
- Wrap every localStorage call in try/catch (use `A.store`).
- After changes, test in a headless browser at phone size (Playwright, Python is installed) and check the console for errors. Fuzz every drill's `gen` at all 10 levels: answers must be defined, finite, non-negative, and choice indexes valid. `A._run()` exposes the current run for tests.

## Roadmap ideas
1. **Offline**: a service worker so it works offline (the manifest and icons are already there).
2. More radar sim variety: climbing/descending traffic, speed control, arrival sequencing.
3. Per-drill progress charts over time.
4. Adaptive difficulty inside a round (step level up/down after streaks).
5. Timed "exam mode" settings that mirror the real suite lengths.
