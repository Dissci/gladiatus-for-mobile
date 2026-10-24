# Gladiatus for mobile: feasibility and architecture analysis

**Question:** can Gladiatus be made comfortable on a phone, without breaking
the game rules and without touching game logic?

"Gladiatus for mobile" (GfM in this document) is an unofficial,
community-made project, not affiliated with Gameforge.

**Short answer:** yes, mostly. Most of it can be fixed with CSS plus a small
amount of layout JavaScript. The hard part is the inventory. It is built on
pixel-exact drag-and-drop that we must not re-implement, only adapt.

Source material for this analysis:

- 37 game pages saved from server `s311-en` in October 2026. They were saved
  with Gladiatus Crazy Addon (GCA) 4.3.12 active, so its DOM changes are
  visible too.
- The game's own `layout.css`, `game.css`, `sprites.css` and `game.js`.
- GCA source at `DinoDevs/GladiatusCrazyAddon` (GPL-3.0, master, Oct 2026).
- The official game rules (forum thread 1426 and the in-game rules page).

---

## 1. How the game is built

### 1.1 Technology

| Layer | What it is | Mobile relevance |
|---|---|---|
| Rendering | Server-rendered HTML per page (`index.php?mod=…&sh=…`), full page reload on most actions | Good: every page is a fresh DOM, so a content script can restyle before first paint |
| Scripts | jQuery 1.11.3, jQuery UI 1.11.4, MooTools 1.x, `game.js` (~70 KB), socket.io chat | Old jQuery UI has **no touch support**; the game adds its own shim (see 1.4) |
| Styles | `layout.css` (8 KB), `game.css` (131 KB), `sprites.css` (34 KB) | **Zero `@media` rules.** 149 `position:absolute` and 157 floats in `game.css` |
| Viewport | **No `<meta name="viewport">`** | Mobile browsers fall back to a ~980 px virtual viewport and shrink everything |
| Server | `sh=` session hash in every URL, `csrf-token` meta, AJAX for item moves | We never need to call it, and must not |

### 1.2 The fixed shell

From `layout.css`:

```
#wrapper_game     min-width: 960px; background centred at 50% 32px
└ #container_game width: 920px; margin: 0 auto; top: 35px
  ├ #buffbar
  ├ #header_game  920×224 px, children absolutely positioned
  │   ├ #header_values_* (gold, rubies, level, HP/XP bars, expedition/dungeon points, arena ranks)
  │   ├ #cooldown_bar_{expedition,dungeon,arena,ct}  (clickable when ready)
  │   └ ul#mainnav  absolute, left: 393px, width: 573px  (sub-tabs of the current module)
  ├ #main 920 px
  │   ├ #sidebar   222 px + 48 px padding, float left   → #mainmenu (all modules)
  │   └ #content   540 px + 110 px padding, float right → the actual page
  └ #footer        920×362 px, absolute children
#mmonetbar          Gameforge network bar (fixed, top)
#banner_right       absolute, left: 882px (ad slot, outside the 920 px box)
```

The page content is **540 px wide**. A 390 px phone in portrait shows about
40 % of the desktop page at 1:1. The default "zoomed-out overview" shows the
whole 960 px at a scale of about 0.4, so 12 px text renders at about 5 px.

### 1.3 Content patterns per page

Counts are taken inside `#content` of each saved page (script:
`scripts/scan-pages.py`, which reads a local folder of saved pages).

| Pattern | Pages | Mobile difficulty |
|---|---|---|
| **Item grids** (`.ui-droppable-grid`, 32 px cells, absolute children) | overview (135 draggables), packages (177), general goods / merchants (218), auction (102), guild market (117), smelter (126-135), Horreum | **High.** Geometry is load-bearing: drop position = `left/32`, `top/32` |
| **Character doll** (`#char`, fixed slot boxes at fixed coordinates on a background image) | overview | High. Same drag system |
| **Data tables** | battle reports (9 tables), packages (11), smelter (10), highscore, arena | Medium. Need horizontal scroll or column hiding |
| **Card rows** (`#expedition_list` → 4 × `.expedition_box`, 123×142 images) | expedition, special event | Low. Wrap into a 2×2 grid |
| **Image maps** (`<map name="dmap">` with `<area coords>`, `onclick="startFight(…)"`) | dungeon | **High.** Area coordinates do not scale with CSS |
| **Forms** | messages (110 inputs), auction (529), guild market (233) | Medium. Inputs need bigger targets and `font-size ≥ 16px` to stop iOS zooming in on focus |
| **Tooltips** (`data-tooltip` JSON, 50-160 per page) | everywhere | Medium. The game already has a touch mode (1.4) |

### 1.4 What the game already does for touch (important)

`game.js` contains a built-in touch adapter that was not obvious before
reading the code:

```js
// simplified from game.js
function d(touchEvent) {
  if (touchEvent.touches.length > 1) return;          // let pinch-zoom through
  const t = touchEvent.changedTouches[0];
  const type = 'mouse' + {start:'down', move:'move', end:'up'}[...];
  t.target.dispatchEvent(new MouseEvent(type, {...t, bubbles:true}));
  if (target is .ui-draggable) preventDefault();       // no scrolling while dragging
}
// tap without move on an element → closeTooltips + trigger('mouseenter.tooltip')
```

The tooltip also has a `.mobile` mode with `tooltip-prev` / `tooltip-next`
arrows for the comparison tooltips.

Consequences:

1. **Drag-and-drop already works by finger** in principle. We must not add a
   second touch→mouse layer. It would double-fire mousedown and break drags.
2. **Tap shows a tooltip** in principle. Our job is to make the tooltip fit the
   screen, not to rebuild it.
3. **What does not work by finger:**
   - `mouseenter` on the bag tabs while dragging. The game opens another bag
     when you hover its tab with an item. Synthetic `mousemove` events do not
     produce `mouseenter`, so moving an item to another bag by finger fails.
   - Anything reachable only by `:hover` (some sub-menus, GCA's advanced menu
     "+" toggles).
   - Precision. A 32 px cell at a 0.4 overview scale is about 13 px on screen,
     far below the usual 44-48 px touch target.

### 1.5 What GCA does today

GCA (`source/core/source/global.js`):

- Detects mobile as `navigator.userAgent` contains `android`, then adds
  `html.gca_mobile_device`. iOS is not detected.
- On mobile, adds **`accessibility.item_move`**: long-press (contextmenu) an
  item, a bar appears with *Move*, tap the target, and GCA simulates the drag.
  It re-applies the listeners every 200 ms with `setInterval`.
- `html.gca_enable_xscroll` allows horizontal scrolling of the page.
- One `@media (max-width:1080px)` rule for its own fixed top bar. Messages get
  a mobile tweak.
- Adds UI to the shell: `#gca_shortcuts_bar`, `#topFixedBar`, the advanced
  `#mainmenu` (`.advanced_menu_entry`), a moved event bar
  (`html.event_bar_moved`) and timers in the header.

**Conclusion:** GCA makes the desktop layout *usable* on Android but does not
make it *responsive*. There is no conflict of purpose. GfM is a layout layer,
and GCA is a feature layer. Many players run GCA, so GfM must lay out GCA's
extra elements too (section 4.6).

---

## 2. Rules, legality and safety

### 2.1 What the rules say

> **§4 Bots and scripts.** Usage of software or scripts in order to gain
> advantages at the expense of other players is not allowed. This includes
> bots, macros and other automatisms.
> (Gladiatus game rules, forum thread 1426 and the in-game rules page)

The rules do not mention cosmetic add-ons or interface modifications. GCA, a
far more invasive add-on, has been public on the Chrome, Firefox and Edge
stores for years. That is a strong signal that UI-only add-ons are tolerated.
It is **not** official permission. Before public release we ask a Gameforge
community manager in writing (see ROADMAP, phase 5).

### 2.2 The compliance model: GfM is "a different stylesheet"

The test we apply to every feature: **could a player get the same result by
zooming, scrolling and tapping in a plain browser?** If yes, it is presentation.
If not, it is out of scope.

| Allowed (presentation) | Forbidden (behaviour) |
|---|---|
| CSS that moves, resizes, hides or stacks existing elements | Any request to the game server (`fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, prefetch links) |
| A viewport meta tag | Clicking, submitting or navigating on the player's behalf |
| UI-only toggles (open the menu drawer, collapse a box) that never reach the server | Timers, schedulers, auto-refresh, "alert me when ready" (§4: automatisms) |
| Translating **one** user gesture into **one** equivalent pointer gesture on the element the user chose (accessibility input adapter, see 4.5) | Repeating, queueing or chaining game actions from one gesture |
| Reading layout data (sizes, positions) from the DOM | Reading game data to compute advice: best food, which enemy to attack, prices |
| | Collecting, storing or sending player data; analytics; remote code |

We deliberately do **not** copy GCA's information features (timers, stats,
notifications). They are legitimate in GCA, but outside a layout project. They
would make GfM harder to defend and would duplicate GCA.

### 2.3 Enforced, not just promised

- `tests/compliance.test.js` fails the build if `src/` contains network APIs,
  `.click()`, `.submit()`, `dispatchEvent`, `setInterval`, `eval`, remote
  `import`, or `location` assignment. The only exception is
  `src/content/input-adapter.js`, which is reviewed under stricter rules (4.5).
- Manifest permissions: **none.** Only `content_scripts` on
  `https://*.gladiatus.gameforge.com/game/index.php*`, plus `storage` for
  layout preferences.
- No telemetry, no external hosts, no bundled third-party code.

### 2.4 Intellectual property

- "Gladiatus" and "Gameforge" are trademarks of Gameforge. The project name
  "Gladiatus for mobile" uses the trademark, so it must always be qualified as
  **unofficial and community-made**: in the README, the add-on description and
  every store listing. Store reviewers (AMO, Greasy Fork) may still ask for a
  name that does not start with a third-party trademark. The fallback is
  "Mobile layout for Gladiatus (unofficial)". The code uses only the neutral
  abbreviation `gfm`, so a rename touches only the docs and the manifest.
- **Never commit game assets** (images, CSS, JS, saved pages). They are
  Gameforge's copyright, and the saved pages also contain the session hash
  `sh=` and `csrf-token`. `fixtures/` is git-ignored. `scripts/sanitize-fixture.mjs`
  strips tokens for local use only.
- GCA is GPL-3.0. GfM is GPL-3.0-or-later, so GCA code (for example the
  item-move helper) can be ported with attribution, and GfM code can flow
  back to GCA.

### 2.5 Player safety

- The game page runs third-party ad scripts (`openX`, `al.php`). GfM never
  exposes extension APIs to the page, and never injects page-world scripts
  except the input adapter.
- **Ads.** We do not hide or block ad slots. We reposition them so they do not
  break the layout (`#banner_right` moves under the content). Blocking them is
  the user's choice with a separate ad blocker, not ours.
- Store distribution (AMO review, Greasy Fork review) and reproducible builds
  let anyone check that the published package matches the source.

---

## 3. Why the obvious approaches fail

| Approach | Why it fails |
|---|---|
| **Just add `width=device-width`** | The shell is still 920 px with `min-width:960px`, so you get a horizontal scroll over a 1:1 desktop page. |
| **`transform: scale()` on `#content`** | jQuery UI computes drag positions from `getBoundingClientRect` (scaled) mixed with `offsetLeft` and `style.left` (unscaled). Items drift and drop into the wrong cell. Image-map hit testing is wrong too. |
| **CSS `zoom` on containers** | Standardised behaviour (Chrome 128+, Firefox 126+) scales `getBoundingClientRect`, but jQuery 1.11 `offset()` math still mixes coordinate spaces. Same drift risk, and it behaves differently across engines. |
| **Re-implement inventory in a custom touch UI** | We would have to issue the game's AJAX move requests ourselves. That is a game client and a rules risk, and it breaks on every game update. |
| **A full "mobile client" (proxy, app, or scraping)** | Account-sharing and automation risk, a privacy problem with the session token, and probably a ToS violation. Rejected. |
| **A fluid (%-based) rewrite of all of `game.css`** | 131 KB of pixel CSS and dozens of absolute sprite layouts. Not maintainable, and it breaks on every game update. |

---

## 4. Proposed architecture

### 4.1 Core idea: two viewport modes, chosen per page

The browser's own viewport scaling is the **only** scaling that keeps every
coordinate system consistent. Hit testing, `getBoundingClientRect`, `offset()`,
image maps and jQuery UI all see unscaled CSS pixels. GfM therefore never
scales elements. It sets a viewport width per page and reflows the shell to fit
that width.

| Mode | Viewport meta | Used on | Effect |
|---|---|---|---|
| **Fit** | `width=560` | Pages with item grids, doll, image maps: overview, packages, merchants, auction, guild market, smelter, Horreum, dungeon | The shell is reflowed to one 560 px column. `#content` keeps its native 540 px geometry. The browser scales the page to the screen (390 px phone: ×0.70). Pinch-zoom still works. Drag math is untouched. |
| **Fluid** | `width=device-width, initial-scale=1` | Text and list pages: messages, reports, highscore, pantheon quests and missions, guild, arena lists, expedition, special event, settings | The shell and content reflow to 100 %. Tables scroll horizontally inside their own box. Text stays at a readable 14-16 px. |

The mode is a static map from `body#id` (and `mod`/`submod` from the URL) to
a mode, in `src/lib/pages.js`. Unknown pages default to **fit**, because fit
mode cannot break a page; it can only be small.

Above a 900 px viewport (tablet landscape, desktop) GfM adds **nothing**.

### 4.2 Injection timeline

```
document_start  (content script, before first paint)
  1. pages.detect(location)               → { page, mode }
  2. <html class="gfm gfm-fit|gfm-fluid gfm-page-<page>">
  3. insert <meta name=viewport content=…> into <head> (create <head> if not parsed yet)
  4. CSS is already applied: the manifest lists the stylesheets for the
     content script, so there is no flash of desktop layout
DOMContentLoaded
  5. layout.js: add the menu-drawer button, wrap wide tables in a
     .gfm-scroll div (pure DOM, no listeners on game elements)
  6. one MutationObserver on #content, limited to childList, for AJAX-replaced
     fragments (auction/market lists), debounced, re-runs step 5 only
```

All styling is gated by `html.gfm` **and** `@media (max-width: 899px)`, so a
desktop with the add-on installed looks identical to vanilla.

### 4.3 Shell reflow (both modes)

| Element | Desktop | GfM |
|---|---|---|
| `#wrapper_game`, `#container_game`, `#main`, `#main_inner` | 960/920 px fixed | `min-width:0; width:auto` |
| `#header_game` (absolute children) | 920×224 art | CSS grid "status bar": row 1 gold, rubies, level; row 2 HP bar, XP bar; row 3 expedition/dungeon points, arena ranks; row 4 four cooldown bars as compact pills (still the game's own links) |
| `ul#mainnav` (module sub-tabs, a table inside!) | absolute, left 393 px | static, horizontal scroll strip with `scroll-snap`, 44 px tall |
| `#sidebar` / `#mainmenu` | 270 px left column | **off-canvas drawer.** A "☰" button toggles `html.gfm-menu-open` (a class toggle only) |
| `#content` | 540 px + 110 px padding | fit: 540 px, padding 0, centred. Fluid: `width:auto`, 8 px padding |
| `#footer`, `#footer_background` | 362 px absolute art | static, compact, **legal links kept** |
| `#banner_right`, `.banner1` | absolute at x = 882 | static block under the content |
| `#mmonetbar` | fixed Gameforge bar | kept; height accounted for in `top` offsets |
| `#buffbar` | absolute icons | horizontal row under the status bar |

### 4.4 Content adaptations (fluid pages)

- **Tables.** Wrap them in `div.gfm-scroll { overflow-x:auto }`. Per-page CSS
  hides low-value columns (for example highscore honour) behind a toggle.
- **Expedition and event cards.** `#expedition_list` becomes a 2×2 grid, and
  the attack buttons get a 44 px minimum height.
- **Forms.** Inputs and selects get `font-size:16px` (stops iOS zoom on focus)
  and a 44 px minimum height.
- **Tooltips.** `max-width: calc(100vw - 16px)` and smaller text. The game's
  own `.mobile` tooltip mode stays as the mechanism.
- **Reports.** The battle-report round tables collapse into stacked rows.

### 4.5 Input adapter (fit pages, optional, phase 3)

This fixes the one thing the game's touch shim cannot do: moving an item to
another bag, or to a slot that is hard to hit.

```
long-press item  → item highlighted, bottom sheet: [Cancel] <name> [Move]
tap target cell / bag tab / doll slot
                 → if bag tab: the adapter opens it with the tab's own link (a navigation the user chose)
                 → one mousedown/mousemove/mouseup sequence from item to target
                   (the same events the game's own touch shim produces)
```

Rules for this file (enforced in review, documented in `CONTRIBUTING.md`):

1. Starts only from a user gesture, and the target is chosen by the user.
2. One gesture leads to at most one drag. No loops, no queues, no "move all".
3. No timers except the long-press threshold (≤ 600 ms).
4. When `html.gca_mobile_device` is present, GfM disables its adapter and
   restyles GCA's `.accessibility-item-move-bar` instead. One adapter per page.

### 4.6 GCA compatibility layer

`src/styles/compat-gca.css` holds rules scoped to the GCA root classes:

- `html.gca_enable_xscroll`: restore `overflow-x:hidden` in GfM mode. We
  provide a layout that fits, so x-scroll is no longer needed.
- `#gca_shortcuts_bar` and `#topFixedBar`: fold into the status bar or the
  drawer.
- `.gca_advance_main_menu .advanced_menu_entry`: make the "+" sub-link toggles
  44 px wide inside the drawer.
- `html.event_bar_moved`: neutralise GCA's absolute offsets.
- The test matrix always covers **vanilla** and **with GCA** (the saved pages
  are already the "with GCA" fixtures).

### 4.7 Delivery targets

One source tree, two build outputs (`scripts/build.mjs`):

| Target | Platform | Notes |
|---|---|---|
| **WebExtension (MV3)** | Firefox for Android (primary), desktop Firefox/Chrome/Edge for testing | CSS through `content_scripts.css` gives no flash of the desktop layout. Distributed on AMO. |
| **Userscript** (`gladiatus-for-mobile.user.js`) | iOS Safari with the free open-source *Userscripts* app; Android Firefox or Kiwi-likes with Tampermonkey/Violentmonkey | CSS is inlined into a `<style>` at `@run-at document-start`. Same JS. |
| Chrome for Android | — | No extension support. Document alternatives, do not hack around it. |

Before each release, check which mobile browsers support extensions at the
time. Support changes often and is not hard-coded in the docs.

### 4.8 Repository layout

```
src/
  manifest.json            MV3, no permissions besides storage
  content/boot.js          document_start: detect page, html classes, viewport meta
  content/layout.js        DOMContentLoaded: drawer button, table wrappers
  content/input-adapter.js (phase 3) the only file allowed to dispatch events
  lib/pages.js             body#id / mod → { page, mode }  (pure, unit-tested)
  styles/base.css          tokens, gating, shell reflow
  styles/fluid.css         fluid-mode content rules
  styles/pages/*.css       per-page tweaks (overview, location, reports …)
  styles/compat-gca.css    GCA layer
scripts/build.mjs          → dist/extension/, dist/gladiatus-for-mobile.user.js
scripts/sanitize-fixture.mjs  strips sh=, csrf, secureHash from saved pages (local only)
tests/                     node:test – pages map, compliance scan, userscript header
fixtures/                  (git-ignored) sanitized saved pages for visual checks
docs/                      this analysis, roadmap, page inventory, rules
```

### 4.9 Testing strategy

| Level | Tool | Runs in CI |
|---|---|---|
| Unit: page detection, mode map, build output | `node --test` | yes |
| Compliance scan | `node --test` (`tests/compliance.test.js`) | yes, blocking |
| Lint the extension | `web-ext lint` | yes |
| Visual: fixtures × {360, 390, 412, 768} × {vanilla, GCA} | Playwright mobile emulation on a local static server | local only (fixtures are private) |
| Real device | Firefox Android over `web-ext run --target=firefox-android` | manual checklist per release |

Acceptance criteria per page:

- No horizontal page scroll in fluid mode.
- Every game control can be reached within one drawer level.
- Primary actions (attack, enter, buy, bid) are at least 44 CSS px tall, or 32 px on fit pages.
- Desktop at 1280 px is pixel-identical with and without the add-on.

---

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gameforge changes markup | High (small changes several times a year) | Pages look broken (not functionally broken, CSS only) | Selectors limited to stable IDs; per-page CSS files; visual fixture diff; fast patch releases |
| Gameforge objects to the add-on | Low (GCA precedent) | Project stops | Ask for written confirmation before public release; presentation-only scope; easy uninstall |
| Drag precision on fit pages is still too small | Medium | Frustrating inventory | Input adapter (4.5); pinch-zoom stays enabled; fit width tunable (540-600) |
| GCA update changes its classes | Medium | Compat glitches | Compat CSS isolated; GCA version in bug template; contact the GCA team early |
| iOS userscript limits | Medium | No `document_start` on some managers, so a flash of desktop layout | Documented; CSS-only fallback |
| Session-token leak through fixtures | Medium if careless | Account takeover | `fixtures/` git-ignored; sanitizer; CI check that rejects `sh=[0-9a-f]{32}` in tracked files |
| Scope creep into features ("add timers") | High in community projects | Rules risk | Compliance table in CONTRIBUTING; PR checklist; automated scan |

---

## 6. Verdict

Feasible with a **CSS-first, viewport-driven** design:

- **About 70 % of the pages** (lists, reports, location pages, forms) can be
  made genuinely mobile-friendly in fluid mode.
- **Item-heavy pages** become clean and usable one-column pages in fit mode.
  They keep their desktop geometry, so the game's drag-and-drop keeps working.
  Comfort comes from the optional input adapter.
- **Nothing** requires talking to the server, automating, or reading game data
  for advantage. The project stays within §4 by design and checks itself
  automatically.
