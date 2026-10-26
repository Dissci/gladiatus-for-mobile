# Contributing

Thanks for helping make Gladiatus playable on phones. Please read the scope
rule first. It protects every player who installs this add-on.

## The scope rule

> Could a player get the same result by zooming, scrolling and tapping in a
> plain browser? If yes, it belongs here. If no, it does not.

**In scope:** CSS, a viewport meta tag, moving or stacking existing elements,
UI-only toggles (drawer, collapse), and readability and accessibility.

**Out of scope, always:**

- requests to the game server, of any kind
- clicking, submitting or navigating for the player
- timers, refreshes, notifications, "tell me when ready"
- computed advice (best food, weakest enemy, prices), statistics, data export
- anything that reads or stores player data beyond the current page's layout

Great features like these exist in
[Gladiatus Crazy Addon](https://github.com/DinoDevs/GladiatusCrazyAddon). Please
propose them there, not here.

`tests/compliance.test.js` enforces most of this. Do not weaken it in the same
PR as a feature.

### The input adapter exception

`src/content/input-adapter.js` (phase 3) is the only file allowed to dispatch
pointer events. It must follow these rules:

1. It starts only from a user gesture, and the user picks both the item and the target.
2. One gesture causes at most one drag. No loops, queues or "move all".
3. Its only timer is the long-press threshold (≤ 600 ms).
4. It stays off when GCA's own mobile item mover is active.

## Adding or fixing a page

1. Save the page in your browser ("Web page, complete") into `fixtures/<area>/`.
2. Run `node scripts/sanitize-fixture.mjs fixtures/<area>/<page>.html`.
3. Check or add its `mod` in [`src/lib/pages.js`](src/lib/pages.js), choose
   `fit` or `fluid`, and add a test case.
4. Put page-specific CSS in `src/styles/pages/<mod>.css` and list it in the manifest.
5. Look at it with `npm run preview` in Firefox responsive design mode
   (the server listens on 127.0.0.1 only).
6. Run `npm run shots` (all pages, about 3 minutes). It compares every page
   at 360, 390 and 412 px (with GCA's styles, as the pages were saved
   with GCA) with the approved
   screenshots. Open the gallery: every changed view must be one you meant to
   change. Then `npm run shots -- --approve`. Do this for every CSS change,
   not only for the page you worked on.
7. Run `npm test` and `npm run test:e2e`. If you changed the shell, extend
   the test page in `tests/e2e/shell-page.mjs` so CI covers it.
8. Update [docs/PAGE-INVENTORY.md](docs/PAGE-INVENTORY.md) and the
   [roadmap](docs/ROADMAP.md).

**Never commit saved pages, screenshots with the URL bar visible, or game
images.** They contain your session token and Gameforge's copyrighted assets.

## CSS conventions

- Gate every rule with `html.gfm` (or `html.gfm-fit`, `html.gfm-fluid`,
  `html.gfm-page-<mod>`) inside `@media (max-width: 899px)`. The one
  exception is hiding GfM's own elements (`#gfm-*`) by default, so they never
  show on desktop.
- Never use `transform: scale` or `zoom`. They break the game's drag-and-drop
  and its image maps. `translate` is fine.
- GfM's own controls are links (`<a href="#" role="button">`), never
  `<button>` or a clickable `<div>`. The game's touch handler cancels the
  click on a tap on anything that is not a link, form field or label.
- Check header and menu changes with `?gca=1` in the preview: the saved pages
  do not include GCA's stylesheet.
- Many game buttons and menu entries are fixed-size slices of one sprite
  image (`menu.png`, `interface.png`). Never make them taller or wider: draw
  them yourself (see the drawer entries and `input.button1` in the CSS).
- Prefer the game's stable IDs over class chains. Touch targets are at least
  `var(--gfm-touch)` (44 px).
- Tabs for indentation, one selector per line.

## Pull requests

- `npm test` passes.
- Fill in the PR checklist. It includes the scope rule.
- Include before/after screenshots at phone width (crop out the URL bar).
  The difference images from `npm run shots` (`fixtures/_shots/diff/`) show
  reviewers exactly what changed, but check them for game assets you may not
  share.
