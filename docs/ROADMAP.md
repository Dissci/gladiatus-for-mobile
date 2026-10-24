# Roadmap

Phases are ordered by value per effort. Each phase ends in a usable release.
Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week (one part-time contributor).

## Phase 0: foundations (this commit)

- [x] Architecture analysis ([ANALYSIS.md](ANALYSIS.md)), page inventory, rules
- [x] Repository template: MV3 extension + userscript build, zero runtime deps
- [x] Compliance scan as a blocking test
- [x] Page/mode map with unit tests
- [x] Fixture sanitizer (strips `sh=`, csrf, `secureHash`)
- [ ] CI on GitHub Actions (test + `web-ext lint`) — workflow file is in place; enable once the repo is pushed
- [ ] Copy the 37 saved pages into `fixtures/` (local) and sanitize them

## Phase 1: the shell (MVP), target v0.1 — M

The goal is that every page fits the screen width and the whole game can be navigated.

- [ ] Viewport injection per mode (fit / fluid) at `document_start`
- [ ] Shell reflow: wrapper widths, status-bar header (gold, rubies, level, HP/XP, points, cooldowns)
- [ ] `#mainnav` as a scroll strip, `#mainmenu` as an off-canvas drawer (☰)
- [ ] Footer, banners and buff bar repositioned (ads kept, not hidden)
- [ ] Location page: enemy cards 2×2, 44 px attack buttons
- [ ] Dungeon: fit mode, map stays at native size and is centred
- [ ] Overview: fit mode, doll and inventory stacked
- [ ] Device check on Firefox for Android at 360 / 390 / 412 px
- [ ] Release: signed `.xpi` (AMO unlisted) for testers

## Phase 2: readable pages, target v0.2 — M

- [ ] Fluid content rules: forms (16 px inputs), headings, boxes
- [ ] Table scroll wrappers; per-page column priorities
- [ ] Reports: stacked battle rounds
- [ ] Highscore, arena, circus lists
- [ ] Pantheon quests, missions, gods: card layouts
- [ ] Messages: folders into a select, full-width compose
- [ ] Guild pages (bank, medic, building map)
- [ ] Tooltips sized to the viewport
- [ ] Save and cover the missing pages (training, forge, work, costumes, stats, settings)

## Phase 3: inventory and touch, target v0.3 — L

- [ ] Fit-page layouts: merchants, packages, auction, guild market, smelter, Horreum
- [ ] `input-adapter.js`: long-press → select → tap target (one gesture = one drag)
- [ ] Bag switching while moving (tap a bag tab during selection)
- [ ] Detect GCA's `item_move`; restyle it instead of running two adapters
- [ ] Playwright visual suite on the local fixtures, vanilla × GCA

## Phase 4: reach, target v0.4 — M

- [ ] Userscript build tested on iOS Safari (*Userscripts* app) and Tampermonkey
- [ ] GCA compatibility layer complete (shortcuts bar, fixed top bar, advanced menu, event bar)
- [ ] Options page: fit width (540-600), per-page on/off, text size
- [ ] RTL servers; underworld skin
- [ ] Chat overlay fits the screen

## Phase 5: community release, v1.0 — M

- [ ] **Ask Gameforge community management in writing** whether the add-on is acceptable; publish the answer in the README
- [ ] Contact the GCA team: shared class names, possible upstream "mobile layout" option
- [ ] Make the repository public; AMO listed release; Greasy Fork userscript
- [ ] Translations of the few UI strings (drawer, adapter bar)
- [ ] Contributor docs: how to save, sanitize and add a page in 15 minutes

## Later / ideas (presentation only)

- Tablet landscape layout (two columns, 900-1200 px)
- High-contrast / large-text accessibility theme
- Install as a home-screen shortcut (documentation only, no service worker on the game origin)

## Never (out of scope by rule)

Timers, notifications, auto-anything, stats, best-food/target advice, server
requests, data export. See [ANALYSIS §2.2](ANALYSIS.md#22-the-compliance-model-gfm-is-a-different-stylesheet).
