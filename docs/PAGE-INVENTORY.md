# Page inventory

Every game page GfM knows, with its viewport mode, its main layout problem
and the phase that covers it. "Saved" means a local fixture exists (the saved
pages are git-ignored, see [ANALYSIS §2.4](ANALYSIS.md#24-intellectual-property)).

Mode: **fit** = `width=560`, native geometry, browser-scaled.
**fluid** = `device-width`, reflowed. See [ANALYSIS §4.1](ANALYSIS.md#41-core-idea-two-viewport-modes-chosen-per-page).

## Saved pages (37)

| Page (`body#id`, mod) | Saved fixture(s) | Mode | Main problem | Phase |
|---|---|---|---|---|
| `overviewPage` (overview) | main_page | fit | Doll + 8×5 inventory, bag tabs need hover during drag | 1 shell, 3 adapter |
| `locationPage` (location) | expedition, special_event ×3 | fluid | 4 enemy cards in a 540 px row | 1 |
| `dungeonPage` (dungeon) | dungeon, enter_dungeon | fit | `<map>` area coords do not scale | 1 |
| `reportsPage` (reports) | kill_expedition, kill_dungeon, arena_battle, treasury_reward, battler_reports | fluid | 9 nested tables per report | 2 |
| `arenaPage` (arena, circus) | arena, arena_provinciarum, circus_turma, circus_provinciarum | fluid | Opponent tables | 2 |
| `playerPage` (player) | player_profile, error_enemy_just_fought | fit | Doll (read-only) + stats | 2 |
| `highscorePage` | highscore, highscore-7days, friends_guild_members | fluid | Wide table, 50 tooltips | 2 |
| `questsPage` (quests) | pantheon | fluid | Quest boxes with icons in a fixed grid | 2 |
| `missionsPage` | missions | fluid | List | 2 |
| `godsPage` | gods | fluid | 8 god boxes with blessing buttons | 2 |
| `messagesPage` | messages | fluid | Form with 110 inputs, folder sidebar | 2 |
| `guildPage` | guild | fluid | Building map (absolute) | 2 |
| `guildBankingHousePage` | bank | fluid | Form + log table | 2 |
| `guild_medicPage` | medic, medic_heal_now | fluid | Simple | 2 |
| `inventoryPage` (merchants) | general_goods | fit | Shop grid + inventory grid side by side (> 540 px together) | 3 |
| `packagesPage` | packages | fit | Filter form + item list + inventory | 3 |
| `auctionPage` | auction | fit | 529 inputs, item list + inventory | 3 |
| `guildMarketPage` | guild_market | fit | Market table + inventory | 3 |
| `forgePage` (smelter, Horreum) | smelter, finished_smelter, horroreum | fit | Slots + inventory + resource table | 3 |

## Not saved yet (save these next)

| Page | Expected mode | Why it matters |
|---|---|---|
| Training (`mod=training`) | fluid | Often visited, simple +buttons |
| Forge / repair tabs | fit | Drag items into forge slots |
| Work / stable (`mod=work`) | fluid | Simple form |
| Costumes (`overview&submod=costumes` or similar) | fluid | Grid of costume cards |
| Statistics / achievements (`overview&submod=stats`) | fluid | Long tables |
| Settings (`mod=settings`) | fluid | Forms |
| Chat panel (socket.io overlay) | n/a | Fixed overlay, must fit the screen |
| Underworld variants (`#wrapper_game.underworld`) | same as normal | Different background, same shell |
| Login / server choice (`lobby.gladiatus.gameforge.com`) | out of scope at first | Different host, separate layout |
| RTL server (any page with `direction: rtl`) | same | Mirror the drawer and grids |

## How to add a page

1. Save the page in the browser ("Web page, complete") into `fixtures/<area>/`.
2. Run `node scripts/sanitize-fixture.mjs fixtures/<area>/<file>.html`.
3. Add the `body#id` (and `mod`/`submod` when the id is shared) to
   [`src/lib/pages.js`](../src/lib/pages.js), choosing fit or fluid.
4. Add `src/styles/pages/<page>.css` if the shell rules are not enough.
5. Fill in a row above.
