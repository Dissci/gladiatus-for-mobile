# Roadmap

Phases are ordered by value per effort. Each phase ends in a usable release.
Effort: S ≤ 1 day, M ≤ 1 week, L > 1 week (one part-time contributor).

Status marks: `[x]` done and verified, `[~]` code drafted but not yet checked
on a real page, `[ ]` not started.

## Next steps (in this order)

Every change can now be seen in seconds without logging in (`npm run preview`,
`npm run shots`), and CI runs the add-on in real Firefox on each push.

**How a layout change is tested (since 2026-10-26).** Checking pages by hand
and sending screenshots did not scale: a fix on one page broke another
unnoticed. Now:

1. `npm run shots` (about 3 minutes) takes every saved page at 360 / 390 /
   412 px with GfM and GCA's stylesheet (111 compared views; the pages were
   saved with GCA, so without its stylesheet GCA's panels show unstyled), with
   **the game's and GCA's real images** (cached in `fixtures/_assets/`), and
   compares each with the last approved screenshot. The gallery
   (`npm run preview` → `/_shots/index.html`) shows only what changed:
   approved, now, and the difference in red.
2. If every change is intended: `npm run shots -- --approve`. A changed view
   is taken twice, so render noise is not reported as a change.
3. The phone is for what saved pages cannot show: finger drag-and-drop, GCA's
   scripts, live timers. When a page looks wrong on the phone, save it into
   `fixtures/` (Ctrl+S, then sanitize) instead of sending a screenshot: it
   becomes a permanent test case.

**Phone sessions (2026-10-24, Android 16, Firefox with GCA).**
Session 1: the drawer could not be opened, the top of the page was a pile-up,
and the pantheon accept / decline buttons were off screen. Session 2: the
pantheon was fixed, but the drawer still did not open and the top bar was
still broken. Causes found and fixed (see Done):

- Saved pages contain GCA's HTML but not GCA's stylesheet, and the preview
  strips the game's scripts, so neither showed in the preview. The preview
  now has `?gca=1` (GCA's real stylesheet) and `?scripts=1`; the browser-test
  page carries the GCA rules GfM undoes and a stand-in for the game's touch
  handler.
- **The game's touch handler cancels the click on anything that is not a
  link, form field or label** (it takes the tap as "show tooltip"). GfM's own
  controls must therefore be `<a role="button">`, never `<button>` or `<div>`.

Session 3 (screenshots of 2026-10-24 evening): the drawer opened and its
links worked, but every entry showed two half buttons, and the header still
took about half the screen. Causes and fixes (see Done):

- **The game's menu buttons are 27 px slices of one sprite** (`menu.png`;
  GCA's `menu_items.png`). GfM made them 44 px tall, so each showed the top
  of the next slice. The drawer now draws its own buttons.
- The header kept HP, points and the four cooldown bars at the top. On the
  user's suggestion they moved to a **dock at the bottom of the screen**, in
  thumb reach, with ☰ at its left end.

Gallery review (2026-10-26, the first screenshots with real images): XP
belongs in the dock with HP, the top bar needed a clean-up, and the whole
page looked shifted left. Fixed (see Done). Second review, same day: tabs
cut off at the edge (arena), "Search for opponent" spilling out of its
button, the highscore table cut off, Move / Delete hanging below each
message, portraits missing in the expedition report (preview only: the
image cache fetched over http), the treasury reward popup off screen.
Fixed (see Done). **The main page (overview) save is incomplete**: its
`main_page_files/` folder (the game's CSS) is missing, also in the
original, so it renders unstyled. It needs saving again ("Web page,
complete").

Third review: the treasury dialog's icon sat on the frame and the dialog
was not centred; the nest search dialog's buttons were stretched sprites
over the text; the main page was unstyled; the packages filter looked
broken. The last two were test artefacts: the main page has no saved
stylesheets (the preview now borrows the game's from another save), and
the plain "GfM" screenshots showed GCA's HTML without GCA's stylesheet,
which no player sees. The screenshots now always include GCA's stylesheet.

**Re-test on the phone is next.**

**Overflow report (`npm run shots`, 37 saved pages × 360 / 390 / 412 px = 111 views).**
It counts a view as bad when the page scrolls sideways, content is cut off at
the screen edge, or content needs the last-resort sideways scroll inside
`#content`. Re-run after each step and record it here.

| Date | Bad views | Note |
|---|---|---|
| 2026-10-24 | 111 / 111 | first run: the shell alone was 585 px wide |
| 2026-10-24 | 27 / 111 | shell fixed; 9 pages left, all page content |
| 2026-10-24 | 18 / 111 | pantheon quests, missions, messages fixed after phone session 1 |
| 2026-10-24 | 18 / 111 | header rebuilt as a grid, Gameforge bar in the flow (phone session 2); same pages left |
| 2026-10-25 | 18 / 111 | bottom dock and drawer buttons (phone session 3); same pages left |
| 2026-10-26 | 18 / 111, with GCA 18 / 111 | first run with real images and the GCA variant; same pages left |
| 2026-10-26 | 18 / 111, with GCA 18 / 111 | XP and ranks in the dock, top bar clean-up, background centred; same pages left |
| 2026-10-26 | 15 / 111, with GCA 15 / 111 | dialogs on screen (loot modal fixed); left: general goods, gods, guild, medic |
| 2026-10-26 | 15 / 111 | from now on one variant (GfM + GCA's styles); main page now styled in the preview |

| # | Step | Effort | Done when |
|---|---|---|---|
| 1 | **Re-test on the phone** (`npm run android`): the drawer buttons and GCA's + / > quick links; the bottom dock (HP bar, points, cooldown buttons); the header from the top and while scrolling; messages Move / Delete / Report; missions. Then drag-and-drop by finger on the overview and the merchant | S | Phase 1 device check ticked |
| 2 | **Header and dock polish** after the phone check: top grid (links · icons, gold, level · XP, ranks · GCA extras · tabs) and dock (☰, HP, points · 4 cooldowns) are in place, now visible with the game's images in the screenshots. Fine-tune spacing and sizes on the device | S | Header and dock readable at 360 px on the phone |
| 3 | **Page content**, from the report: gods (`#gods`), guild building map, medic (`#guild_medicus_heal`), merchant inventory tabs (`#inventory_nav`, fit). Main page (overview): re-save when convenient, the preview borrows its stylesheets | M | 0 bad views |
| 4 | Footer, buff bar, banners: check each against the screenshots | S | Phase 1 items below move from `[~]` to `[x]` |
| 5 | **Layout checks on every saved page** (testing step 3): header values do not overlap, the dock is at the bottom and covers no control, touch targets ≥ 44 px, drawer entries are not sprite slices, the drawer opens and closes. Run with `npm run shots` and before each push; each phone bug becomes a check | M | Checks run on all 37 pages |
| 6 | **Phone screenshots without logging in** (testing step 4): the preview served over Wi-Fi, a script opens each saved page in Firefox on the phone via `adb` and takes screenshots into the same gallery. Real Firefox for Android rendering, no game server involved | M | One command gives the phone gallery |

### Done

- [x] Fixture preview harness `scripts/preview.mjs` (`npm run preview`): saved pages with GfM injected, `?gfm=0` for before/after
- [x] **Real images in the preview and the screenshots** (`scripts/assets.mjs`): the game's `/cdn/` files, `*.geo.gfsrv.net` and GCA's images (from GCA's GitHub at v4.3.12) are downloaded once, without cookies, into the git-ignored `fixtures/_assets/`. Only those hosts and only static file types; everything else stays blocked
- [x] **Screenshot comparison** (`npm run shots`, `scripts/compare.mjs`): 111 views (37 pages × 3 widths, GfM + GCA's stylesheet; first 222 with a GfM-only variant, dropped as misleading) compared with an approved baseline, gallery of changed views with a red difference image, `--approve`, a second take for changed views against render noise. Checked: three runs in a row with 0 changes, a one-line dock change is caught on the dock only. Unit tests for the allowed hosts, cache paths, GCA image paths and the comparison
- [x] Screenshot script `scripts/screenshots.mjs` (`npm run shots`): every saved page × 360 / 390 / 412 px × with/without GfM, a side-by-side gallery and a sideways-overflow report
- [x] Boot path verified in real Firefox. **Bug found and fixed:** `pages.js` exported on `this` and `boot.js` read `window.gfmPages`. In a Firefox content script these are different objects, so the add-on did nothing at all. Both now use `globalThis`
- [x] Viewport tag inserted before `<head>` exists takes effect (Chrome phone emulation, both modes). Firefox Android is still to check on a device (step 6)
- [x] CI is green on GitHub and now also runs the browser tests (`npm run test:e2e`): the add-on installed in headless Firefox, and the userscript in Chrome phone emulation, both on a test page written for this repo
- [x] **Bug found and fixed:** the ☰ button showed as a plain button at the bottom of every page on desktop
- [x] Phone session 1 fixes: **the ☰ button was covered** by the Gameforge bar (and by GCA's fixed bar when scrolled), so the drawer could not open. It is now a floating button at the bottom left, above everything, and the closed drawer is hidden instead of peeking out at the left edge. **GCA's "top fixed bar"** pinned header values at desktop positions when scrolling; on phones they stay in the header and the bar is hidden. **GCA's moved event bar** pushed the banner 155 px into the header; undone. **Pantheon quests, missions and messages** reflow to the screen width, so the accept / decline buttons and Move / Delete / Report are on screen. Anything still too wide now scrolls inside the content instead of being cut off
- [x] Phone session 2 fixes: **the drawer button and backdrop are links now** (`<a role="button">`). As a `<button>`/`<div>` their clicks were cancelled by the game's touch handler; checked against the real handler on the saved pages (`?scripts=1`) and by a stand-in in the Chrome tests. **Header rebuilt as a 6-column grid** (see step 2), GCA's "extend" HP/XP offsets undone, and **the Gameforge bar is in the flow at the top** instead of absolute over the header (its markup is at the end of `<body>`, so `<body>` is a flex column with the bar ordered first). Preview: `?gca=1` adds GCA's real stylesheet (v4.3.12, downloaded once into `fixtures/_gca/`)
- [x] Phone session 3 fixes: **drawer entries are GfM's own 44 px buttons** (gradient, border; active and premium marked) instead of the game's 27 px sprite slices, which showed two half buttons each; GCA's + / > quick links and their link rows are 44 px touch targets. **Bottom dock**: HP bar, expedition / dungeon points and the four cooldown buttons are `position: fixed` at the bottom (the game's own elements, nothing moved in the DOM), ☰ sits at the dock's left end, the page and the drawer keep room for it. The top header is about 40 % shorter: GCA's attack timers, global arena timer and header buttons are packed into the grid, sub-tabs last. Browser tests: the dock stays in the lowest 100 px (vanilla, GCA, scrolled) and drawer entries are ≥ 44 px without the sprite; both fail on the old CSS
- [x] Gallery review fixes: **XP in the dock** next to HP (each bar with its points and percentage), and each cooldown button has its value above it: expedition and dungeon points, arena and Circus Turma ranks. **Background**: the desktop art's stone pillar showed left of the content, so everything looked shifted left; the art is now offset to show its parchment only. **Top bar**: the Gameforge bar is one 32 px line (logo, country as a flag, "More games") instead of about 105 px; GCA's four attack timers sit on one line; **sub-tabs** are one sideways-scrolling line of 44 px tabs (the packages page had 22 tabs wrapped into a 400 px grid, GCA's 17 px squeeze undone). Dark page background below the footer
- [x] Second gallery review fixes: **sub-tabs** are a flattened, wrapping row (one cell per tab or all in one cell), so no tab is cut off; only long sets (the 22 package filters) scroll. **Dialogs** (`.cancel_confirm`, the loot modal) are placed on screen between the top and the dock instead of at their desktop position (`left: 651px`), with 44 px buttons: the treasury reward popup shows. **Old sprite buttons** (`input.button1/2/3`, e.g. "Search for opponent") drawn like awesome-buttons instead of stretched slices. **Messages**: Move / Delete / Report / Answer are a row of 44 px links inside each message. **Highscore** (`pages/highscore.css`): compact cells, rank and name pinned while the numbers scroll. Preview: protocol-relative images are fetched over https (portraits were missing). Browser tests: tabs and an open dialog stay on screen at 360 px (fails on the old CSS)
- [x] Third gallery review fixes: **dialogs centred** between the top and the dock (inset + auto margins), content kept off the frame's transparent edges (9 % padding), icons 48 px. **Nest search (loot modal)**: buttons drawn instead of stretched 159 × 26 sprites, and in the flow below the text instead of absolute over it. Preview: a save missing its `_files/` folder borrows the game's stylesheets from another save (the main page renders). Screenshots: one compared variant, GfM + GCA's stylesheet; the reference "without GfM" also has GCA's stylesheet
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
- [~] `#mainnav` as a scroll strip, `#mainmenu` as an off-canvas drawer (☰) (`base.css`, `layout.js`). The drawer opens on the phone (session 3); its own touch-sized buttons are new and need a phone re-test
- [~] Bottom dock: HP, XP, expedition / dungeon points, arena / circus ranks, cooldown buttons (`base.css`). Tested in both browsers and on the saved pages; phone check pending
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
- [~] Highscore (rank and name pinned, numbers scroll), arena, circus lists
- [~] Pantheon quests, missions: rows reflow, buttons on screen (`pages/quests.css`, `pages/missions.css`); phone re-test pending
- [ ] Gods: card layout
- [~] Messages: full-width message boxes, pagination, Move / Delete / Report as 44 px links (`pages/messages.css`); folders into a select, compose not started
- [ ] Guild pages (bank, medic, building map)
- [~] Tooltips sized to the viewport (one `max-width` rule; needs checking with the game's `.mobile` tooltip mode)
- [ ] Save and cover the missing pages (training, forge, work, costumes, stats, settings), see [PAGE-INVENTORY](PAGE-INVENTORY.md#not-saved-yet-save-these-next)

## Phase 3: inventory and touch, target v0.3 (L)

- [ ] Fit-page layouts: merchants, packages, auction, guild market, smelter, Horreum
- [ ] `input-adapter.js`: long-press → select → tap target (one gesture = one drag)
- [ ] Bag switching while moving (tap a bag tab during selection)
- [ ] Detect GCA's `item_move`; restyle it instead of running two adapters
- [x] Turn the screenshot script into a visual diff suite (compare with the approved run), vanilla × GCA

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
