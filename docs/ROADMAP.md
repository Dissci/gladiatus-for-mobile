# Roadmap

Phases are ordered by value per effort. Each phase ends in a usable release.
Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week (one part-time contributor).

Status marks: `[x]` done and verified, `[~]` code drafted but not yet checked
on a real page, `[ ]` not started.

## Next steps (in this order)

Every change can now be seen in seconds without logging in (`npm run preview`,
`npm run shots`), and CI runs the add-on in real Firefox on each push.

**First phone session (2026-10-24, Android 16, Firefox with GCA):** the menu
drawer could not be opened, the top of the page was a pile-up, and in the
pantheon the accept / decline buttons were off screen and unreachable. All
three are fixed (see Done) and covered by browser tests; **re-test on the
phone is next.** Lesson: saved pages contain GCA's HTML but not GCA's
stylesheet, so GCA layout conflicts only show on a real device. The test page
now carries the GCA rules GfM has to undo.

**Overflow report (`npm run shots`, 37 saved pages × 360 / 390 / 412 px = 111 views).**
It counts a view as bad when the page scrolls sideways, content is cut off at
the screen edge, or content needs the last-resort sideways scroll inside
`#content`. Re-run after each step and record it here.

| Date | Bad views | Note |
|---|---|---|
| 2026-10-24 | 111 / 111 | first run: the shell alone was 585 px wide |
| 2026-10-24 | 27 / 111 | shell fixed; 9 pages left, all page content |
| 2026-10-24 | 18 / 111 | pantheon quests, missions, messages fixed after the phone session |

| # | Step | Effort | Done when |
|---|---|---|---|
| 1 | **Re-test on the phone** (`npm run android`): drawer, top of the page while scrolling (GCA bar), pantheon accept / decline, messages Move / Delete / Report, missions progress. Then drag-and-drop by finger on the overview and the merchant | S | Phase 1 device check ticked |
| 2 | **Header status bar.** It fits and nothing overlaps, but it is still the desktop pieces in a row: values without labels, "Go to expedition" cut to "Go to", GCA's timers loose. Rebuild it as the grid from [ANALYSIS §4.3](ANALYSIS.md#43-shell-reflow-both-modes), from the real markup in the fixtures | M | Gold, rubies, level, HP/XP, points and the 4 cooldowns readable at 360 px |
| 3 | **Page content**, from the report: gods (`#gods`), guild building map, medic (`#guild_medicus_heal`), the loot modal (`#blackoutDialog`), merchant inventory tabs (`#inventory_nav`, fit) | M | 0 bad views |
| 4 | Footer, buff bar, banners: check each against the screenshots | S | Phase 1 items below move from `[~]` to `[x]` |
| 5 | Optional: `npm run preview -- --gca` that adds GCA's stylesheet (fetched from its GitHub release at a pinned version, never committed), so GCA conflicts show in the screenshots too | S | Report run with and without GCA |

### Done

- [x] Fixture preview harness `scripts/preview.mjs` (`npm run preview`): saved pages with GfM injected, `?gfm=0` for before/after
- [x] Screenshot script `scripts/screenshots.mjs` (`npm run shots`): every saved page × 360 / 390 / 412 px × with/without GfM, a side-by-side gallery and a sideways-overflow report
- [x] Boot path verified in real Firefox. **Bug found and fixed:** `pages.js` exported on `this` and `boot.js` read `window.gfmPages`. In a Firefox content script these are different objects, so the add-on did nothing at all. Both now use `globalThis`
- [x] Viewport tag inserted before `<head>` exists takes effect (Chrome phone emulation, both modes). Firefox Android is still to check on a device (step 6)
- [x] CI is green on GitHub and now also runs the browser tests (`npm run test:e2e`): the add-on installed in headless Firefox, and the userscript in Chrome phone emulation, both on a test page written for this repo
- [x] **Bug found and fixed:** the ☰ button showed as a plain button at the bottom of every page on desktop
- [x] Phone session 1 fixes: **the ☰ button was covered** by the Gameforge bar (and by GCA's fixed bar when scrolled), so the drawer could not open. It is now a floating button at the bottom left, above everything, and the closed drawer is hidden instead of peeking out at the left edge. **GCA's "top fixed bar"** pinned header values at desktop positions when scrolling; on phones they stay in the header and the bar is hidden. **GCA's moved event bar** pushed the banner 155 px into the header; undone. **Pantheon quests, missions and messages** reflow to the screen width, so the accept / decline buttons and Move / Delete / Report are on screen. Anything still too wide now scrolls inside the content instead of being cut off
- [x] Shell-wide overflow: the Gameforge bar (`#mmoContent` 585 px), `#banner_event` and its link, the cooldown bar fills and links, the HP/XP percentages, the header link row. Header boxes are `relative` with the desktop offsets reset, so their absolute children stay inside them
- [x] `npm run android` fixed: it targeted Firefox Nightly (`org.mozilla.fenix`) instead of the Play Store Firefox, and web-ext needs the device ID. `scripts/android.mjs` now picks the phone and the installed Firefox, and explains the usual setup errors

## Phase 0: foundations

- [x] Architecture analysis ([ANALYSIS.md](ANALYSIS.md)), page inventory, rules
- [x] Repository template: MV3 extension + userscript build, zero runtime deps
- [x] Compliance scan as a blocking test
- [x] Page/mode map with unit tests
- [x] Fixture sanitizer (strips `sh=`, csrf, `secureHash`)
- [x] Copy the 37 saved pages into `fixtures/` (local) and sanitize them
- [x] CI on GitHub Actions (test + build + `web-ext lint` + browser tests)
- [x] Fix doc drift: ANALYSIS §2.3/§4.8 said "`storage` permission", the manifest and tests say none. Now none until the phase 4 options page needs it

## Phase 1: the shell (MVP), target v0.1 (M)

The goal is that every page fits the screen width and the whole game can be navigated.

- [x] Preview harness + screenshot script
- [x] Browser tests in CI: Firefox add-on + Chrome userscript (`tests/e2e/`)
- [x] Viewport injection per mode (fit / fluid) at `document_start` (`boot.js`). Verified in Firefox (tag set) and Chrome emulation (tag applied)
- [~] Shell reflow: wrapper widths, status-bar header (gold, rubies, level, HP/XP, points, cooldowns) (`base.css`). Overflows on every saved page (next steps 1-2)
- [~] `#mainnav` as a scroll strip, `#mainmenu` as an off-canvas drawer (☰) (`base.css`, `layout.js`). The drawer opens on all 37 saved pages and in both test browsers, also with GCA; phone re-test pending
- [~] Footer, banners and buff bar repositioned (ads kept, not hidden). The buff bar has no rule yet
- [~] Location page: enemy cards 2×2, 44 px attack buttons (`pages/location.css`). Looks right in the screenshots; device check pending
- [~] Dungeon: fit mode, map stays at native size and is centred (`pages/dungeon.css`, centring missing)
- [ ] Overview: fit mode, doll and inventory stacked (`pages/overview.css`)
- [ ] Drawer closes on Escape and after choosing a menu link; focus moves into it (accessibility)
- [ ] Device check on Firefox for Android at 360 / 390 / 412 px
- [ ] Release: signed `.xpi` (AMO unlisted) for testers

## Phase 2: readable pages, target v0.2 (M)

- [~] Fluid content rules: forms (16 px inputs), headings, boxes (`fluid.css`)
- [~] Table scroll wrappers (`layout.js`); per-page column priorities not started
- [ ] MutationObserver on `#content` for AJAX-replaced fragments (ANALYSIS §4.2 step 6), debounced, re-runs the table wrapping only
- [ ] Reports: stacked battle rounds
- [ ] Highscore, arena, circus lists
- [~] Pantheon quests, missions: rows reflow, buttons on screen (`pages/quests.css`, `pages/missions.css`); phone re-test pending
- [ ] Gods: card layout
- [~] Messages: full-width message boxes and pagination (`pages/messages.css`); folders into a select, compose not started
- [ ] Guild pages (bank, medic, building map)
- [~] Tooltips sized to the viewport (one `max-width` rule; needs checking with the game's `.mobile` tooltip mode)
- [ ] Save and cover the missing pages (training, forge, work, costumes, stats, settings), see [PAGE-INVENTORY](PAGE-INVENTORY.md#not-saved-yet-save-these-next)

## Phase 3: inventory and touch, target v0.3 (L)

- [ ] Fit-page layouts: merchants, packages, auction, guild market, smelter, Horreum
- [ ] `input-adapter.js`: long-press → select → tap target (one gesture = one drag)
- [ ] Bag switching while moving (tap a bag tab during selection)
- [ ] Detect GCA's `item_move`; restyle it instead of running two adapters
- [ ] Turn the screenshot script into a visual diff suite (compare with the previous run), vanilla × GCA

## Phase 4: reach, target v0.4 (M)

- [ ] Userscript build tested on iOS Safari (*Userscripts* app) and Tampermonkey
- [~] GCA compatibility layer complete (shortcuts bar, fixed top bar, advanced menu, event bar). Fixed top bar and moved event bar handled (`compat-gca.css`), checked against GCA's own CSS; shortcuts bar and advanced menu not checked on a device yet
- [ ] Options page: fit width (540-600), per-page on/off, text size (adds the `storage` permission; update the compliance test in its own PR)
- [ ] RTL servers; underworld skin
- [ ] Chat overlay fits the screen

## Phase 5: community release, v1.0 (M)

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
