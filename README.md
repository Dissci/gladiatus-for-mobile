# Gladiatus for mobile

**An unofficial, community-made mobile layout for the Gladiatus browser game.**
It is not affiliated with or endorsed by Gameforge.

Gladiatus was built for 920 px desktop screens. On a phone you get a tiny
zoomed-out page, or a lot of sideways scrolling. Gladiatus for mobile
rearranges the page so it fits your phone:

- the header becomes a compact status bar
- the menu becomes a drawer
- lists, reports and forms reflow to the screen width
- inventory pages become one clean column that keeps the game's own drag-and-drop working

## Safe by design

| | |
|---|---|
| ✅ Changes how pages **look** | ❌ Never plays for you: no clicks, no timers, no auto-anything |
| ✅ Works with Gladiatus Crazy Addon | ❌ Never talks to the game server |
| ✅ No permissions, no tracking, no data collection | ❌ Never reads game data to give you an advantage |

The game rules (§4) forbid "software or scripts in order to gain advantages at
the expense of other players … bots, macros and other automatisms". This
project changes only the layout, like a different stylesheet. Every build
checks this automatically
([`tests/compliance.test.js`](tests/compliance.test.js)). The reasoning is in
[docs/ANALYSIS.md §2](docs/ANALYSIS.md#2-rules-legality-and-safety).

> Status: **phase 1, pre-alpha.** The shell layout is drafted and runs in
> Firefox and as a userscript, but it is not yet usable on a phone. See the
> [roadmap](docs/ROADMAP.md).

[![CI](https://github.com/Dissci/gladiatus-for-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/Dissci/gladiatus-for-mobile/actions/workflows/ci.yml)

## Install (testers)

| Platform | How |
|---|---|
| Android | Firefox for Android + the add-on (`.xpi` from releases, later on addons.mozilla.org) |
| iPhone / iPad | Safari + the free *Userscripts* app + `gladiatus-for-mobile.user.js` |
| Android, other browsers | Tampermonkey or Violentmonkey + the userscript |
| Desktop | Not needed. The add-on does nothing above 900 px width |

## Documents

- [Architecture analysis](docs/ANALYSIS.md): how the game is built, what breaks on mobile, the design and the rules
- [Roadmap](docs/ROADMAP.md)
- [Page inventory](docs/PAGE-INVENTORY.md): every game page, its mode and its status
- [Contributing](CONTRIBUTING.md), including what is out of scope
- [Security policy](SECURITY.md)

## Development

Requires Node 20+. The add-on itself has no dependencies; `npm install` only
fetches the dev tools (Puppeteer for the browser tests).

```sh
npm test          # unit + compliance + repo hygiene tests (no browser needed)
npm run test:e2e  # the add-on in real Firefox + the userscript in Chrome phone emulation
npm run build     # dist/extension/ and dist/gladiatus-for-mobile.user.js
npm run lint      # web-ext lint
npm run preview   # saved pages from fixtures/ with GfM applied, http://127.0.0.1:8560/
npm run shots     # screenshots of every saved page at 360/390/412 px + overflow report
npm start         # desktop Firefox on the live game; responsive design mode (Ctrl+Shift+M)
npm run android   # Firefox on a USB-connected Android phone (adb), see below
```

### Testing on an Android phone

1. Phone: turn on Developer options (tap *Build number* 7 times) and **USB
   debugging**. Install Firefox from the Play Store and turn on Settings →
   **Remote debugging via USB**.
2. Connect it by USB and accept "Allow USB debugging?" (tick *Always allow*).
   `adb devices` must show the phone as `device`, not `unauthorized`.
3. `npm run android`. It finds the phone and the installed Firefox (release,
   Beta or Nightly), then opens Firefox there with the add-on loaded from
   `src/`. Edits reload it live. Log into the game on the phone.
4. To inspect the phone's tab from the PC: desktop Firefox → `about:debugging`.

The add-on stays installed only while `npm run android` runs. Tablets: GfM
switches off at 900 px and wider, so test in portrait.

Before the first `test:e2e` or `shots`, download the test browsers once:
`npx puppeteer browsers install chrome` and `npx puppeteer browsers install firefox`.

CI runs `npm test`, the build, `web-ext lint` and `npm run test:e2e` on every
push. The browser tests use a test page written for this repository
([`tests/e2e/shell-page.mjs`](tests/e2e/shell-page.mjs)), never real game pages.

```
src/
  manifest.json        MV3, no permissions
  lib/pages.js         URL → page + viewport mode (fit / fluid)
  content/boot.js      document_start: <html> classes + viewport meta
  content/layout.js    menu drawer button, table scroll wrappers
  styles/              base shell, fluid pages, GCA compatibility, per-page CSS
scripts/               build, preview server, screenshots, fixture sanitizer, page scanner
tests/                 node:test; tests/e2e/ runs real browsers
docs/                  analysis, roadmap, page inventory
```

### Working with saved pages

Saved game pages for testing go into `fixtures/`, which is git-ignored. They
contain Gameforge assets and your session token. Run
`node scripts/sanitize-fixture.mjs <file>` on each one.

`npm run preview` serves them with the add-on injected, the way the content
script runs. The page's own scripts are left out by default, because a saved
page is already a snapshot of the DOM after the game and GCA ran. Add
`?gfm=0` to a page URL to see it without GfM, `?scripts=1` to keep its
scripts (the game's touch handler, for example), or `?gca=1` to add Gladiatus
Crazy Addon's stylesheet. Saved pages contain GCA's HTML but not its CSS, so
use `?gca=1` for anything near the header or menu. It is downloaded once from
GCA's GitHub into `fixtures/_gca/`. `npm run shots` writes `fixtures/_shots/`, which you can browse from
the preview's start page.

## License

[GPL-3.0-or-later](LICENSE). That is the same family as Gladiatus Crazy Addon
(GPL-3.0), so code can be shared in both directions with attribution.
"Gladiatus" and "Gameforge" are trademarks of Gameforge. They are used here only
to say which game this add-on works with.
