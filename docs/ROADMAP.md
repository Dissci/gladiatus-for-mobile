# Roadmap

Phases are ordered by value per effort. Each phase ends in a usable release.
Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week (one part-time contributor).

Status marks: `[x]` done and verified, `[~]` code drafted but not yet checked
on a real page, `[ ]` not started.

## Next steps (in this order)

Every change can now be seen in seconds without logging in (`npm run preview`,
`npm run shots`), and CI runs the add-on in real Firefox on each push. The
work now is making the drafted shell actually fit.

**Overflow report (`npm run shots`, 37 saved pages × 360 / 390 / 412 px = 111 views).**
It counts a view as bad when the page scrolls sideways *or* content is cut
off at the screen edge (`overflow-x: hidden` hides the second from
`scrollWidth`, so both are measured). Re-run after each step and record it here.

| Date | Bad views | Note |
|---|---|---|
| 2026-10-24 | 111 / 111 | first run: the shell alone was 585 px wide |
| 2026-10-24 | 27 / 111 | shell fixed (step 1 below, done); 9 pages left, all page content |

| # | Step | Effort | Done when |
|---|---|---|---|
| 1 | ~~**Shell-wide overflow**~~ **done**: the Gameforge bar (`#mmoContent` 585 px), `#banner_event` and its link, the cooldown bar fills and links, the HP/XP percentages, the header link row. Header boxes are now `relative` with the desktop offsets reset, so their absolute children stay inside them. Covered by the browser tests | S | No view is bad because of the shell |
| 2 | **Header status bar.** It fits now, but the values have no icons or labels, "Go to expedition" is cut to "Go to", and GCA's timers float loose. Rebuild it as the grid from [ANALYSIS §4.3](ANALYSIS.md#43-shell-reflow-both-modes), from the real markup in the fixtures | M | Gold, rubies, level, HP/XP, points and the 4 cooldowns readable at 360 px |
| 3 | **Top of the page.** The ☰ button covers the Gameforge bar's logo, and the bar (absolute, 32 px) overlaps the header's link row. Reserve the bar's height, then put the button in the status bar row | S | Nothing overlaps at 360 px |
| 4 | **Page content**, from the report: messages (`.message_box`), missions and pantheon (`.contentboard_header_*`), gods (`#gods`), guild building map, medic (`#guild_medicus_heal`), the loot modal (`#blackoutDialog`), merchant inventory tabs (`#inventory_nav`, fit) | M | 0 bad views |
| 5 | Footer, buff bar, banners: check each against the screenshots | S | Phase 1 items below move from `[~]` to `[x]` |
| 6 | First device session on Firefox for Android (`npm run android`, setup in the [README](../README.md#testing-on-an-android-phone)): viewport tag honoured in fit and fluid mode, drawer, scrolling, drag-and-drop by finger. The tooling works with a real phone (Android 16, Play Store Firefox); the session itself is pending | S | Phase 1 device check ticked |

### Done

- [x] Fixture preview harness `scripts/preview.mjs` (`npm run preview`): saved pages with GfM injected, `?gfm=0` for before/after
- [x] Screenshot script `scripts/screenshots.mjs` (`npm run shots`): every saved page × 360 / 390 / 412 px × with/without GfM, a side-by-side gallery and a sideways-overflow report
- [x] Boot path verified in real Firefox. **Bug found and fixed:** `pages.js` exported on `this` and `boot.js` read `window.gfmPages`. In a Firefox content script these are different objects, so the add-on did nothing at all. Both now use `globalThis`
- [x] Viewport tag inserted before `<head>` exists takes effect (Chrome phone emulation, both modes). Firefox Android is still to check on a device (step 6)
- [x] CI is green on GitHub and now also runs the browser tests (`npm run test:e2e`): the add-on installed in headless Firefox, and the userscript in Chrome phone emulation, both on a test page written for this repo
- [x] **Bug found and fixed:** the ☰ button showed as a plain button at the bottom of every page on desktop
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
- [~] `#mainnav` as a scroll strip, `#mainmenu` as an off-canvas drawer (☰) (`base.css`, `layout.js`). The drawer opens and closes in both browsers; the button covers the Gameforge bar
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
- [ ] Pantheon quests, missions, gods: card layouts
- [ ] Messages: folders into a select, full-width compose
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
- [~] GCA compatibility layer complete (shortcuts bar, fixed top bar, advanced menu, event bar). First rules are in `compat-gca.css`; the event bar is missing
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
