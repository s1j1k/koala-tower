# ATC Trainer

A free, mobile-first practice app for the Airservices Australia air traffic controller selection tests. Built for one candidate's own prep, so it should be fast and simple, with no backend.

## Context: what the real tests are
Airservices Australia uses the **SureSelect** test battery (by Airways International / Airways NZ). The online stage has three suites:

1. **ATC Skill Simulations** (~1.5 h, gamified): short-term memory, spatial awareness, remembering relationships, radar simulation (safety, efficiency, multi-tasking).
2. **ATC Cognitive Ability Suite** (~45 min): detail accuracy (~15 min) and coded reasoning (~30 min).
3. **Behavioural Traits** questionnaire (personality; not something to drill).

None of them needs aviation knowledge. Practice should look and feel like these tasks, with mental maths as supporting work.

## Current state
- `index.html`: one self-contained page (inline CSS and JS, no build step, no dependencies).
- Modes: Arithmetic, Unit conversions (ft/m, NM/km, kt/km/h, flight levels, reciprocal headings, hours/minutes), Speed/distance/time (NM per minute, time to go, closing speed, time to meet), and Mixed.
- 3 difficulty levels; 1, 2 or 5 minute rounds; exact answers auto-advance; conversions accept anything within 5%; tips on misses; review list at the end; best score per setting kept in localStorage.

## Conventions
- Keep it working as a single static page that opens straight from the file (and from GitHub Pages later). If it grows, split into `js/` and `css/` files with no bundler.
- Mobile first (about 390 px wide), dark theme, big tap targets, `inputmode="decimal"` for answers.
- Wrap every localStorage call in try/catch.
- Plain vanilla JS, no frameworks unless clearly needed.
- After changes, test in a headless browser at phone size (Playwright) and check the console for errors.

## Roadmap ideas (priority order)
1. **Radar simulation drill**: aircraft dots moving on a canvas; spot conflicts (will two aircraft come within X NM?) and give instructions. Score safety and efficiency.
2. **Detail accuracy / error checking**: compare two tables or code strings and mark the mismatches, against the clock.
3. **Coded reasoning**: apply a rule set (if X then code A...) to items quickly.
4. **Short-term memory**: callsigns, altitudes and headings shown briefly, then recalled; n-back and digit span.
5. **Spatial**: mental rotation, compass bearings between points, relative position after turns.
6. **Progress tracking**: history per mode and a simple chart over time.
7. **PWA**: manifest and service worker so it installs on the phone home screen and works offline.
8. **Daily session**: a 10-minute mixed workout that weights the user's weakest areas.
