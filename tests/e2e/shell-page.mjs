// A stand-in for a game page: the shell IDs and fixed desktop widths from
// docs/ANALYSIS.md §1.2, written from scratch. No Gameforge markup or assets,
// so it can live in the repository and run in CI.
export const GAME_URL = 'https://s1-en.gladiatus.gameforge.com/game/index.php';

const GAME_CSS = `
body { margin: 0; font: 12px Arial, sans-serif; }
#wrapper_game { min-width: 960px; position: relative; }
#container_game { width: 920px; margin: 0 auto; position: relative; top: 35px; }
#header_game { width: 920px; height: 224px; position: relative; }
#header_game > div { position: absolute; }
#header_values_gold { left: 560px; top: 12px; }
#header_values_ruby { left: 660px; top: 12px; }
#header_values_level { left: 760px; top: 12px; }
#header_values_hp { left: 300px; top: 60px; width: 200px; }
#header_values_xp { left: 300px; top: 90px; width: 200px; }
#cooldown_bar_expedition { left: 300px; top: 140px; width: 110px; }
#cooldown_bar_dungeon { left: 420px; top: 140px; width: 110px; }
#cooldown_bar_arena { left: 540px; top: 140px; width: 110px; }
#cooldown_bar_ct { left: 660px; top: 140px; width: 110px; }
ul#mainnav { position: absolute; left: 393px; top: 190px; width: 573px; margin: 0; padding: 0; list-style: none; }
ul#mainnav table { position: relative; top: 4px; }
#main { width: 920px; }
#sidebar { float: left; width: 222px; padding: 0 24px; }
#mainmenu a.menuitem { display: block; height: 28px; }
#content { float: right; width: 540px; padding: 0 55px; }
#footer { clear: both; width: 920px; height: 362px; position: relative; }
#footer_inner { position: absolute; left: 100px; top: 200px; width: 720px; }
#banner_right { position: absolute; left: 882px; top: 0; width: 160px; height: 600px; }
#expedition_list .expedition_box { float: left; width: 123px; height: 142px; margin: 0 5px; }
`;

const CONTENT = {
	locationPage: `
		<div id="expedition_list">
			${[1, 2, 3, 4].map((n) => `<div class="expedition_box"><div>Enemy ${n}</div><button class="expedition_button">Attack</button></div>`).join('')}
		</div>
		<table id="wide_table" style="width: 800px"><tr><td>a wide report table</td><td>with many columns</td></tr></table>`,
	overviewPage: `<div id="char" style="width: 540px; height: 300px">doll</div>
		<div id="inv" style="width: 260px; height: 160px">inventory grid</div>`,
};

/**
 * @param {string} bodyId e.g. "locationPage"
 * @param {{ beforeHead?: string }} [options] markup placed before <head>, where a document-start script runs
 */
export function shellPage(bodyId, options = {}) {
	return `<!doctype html>
<html>${options.beforeHead || ''}<head><meta charset="utf-8"><title>GfM test shell</title><style>${GAME_CSS}</style></head>
<body id="${bodyId}">
<div id="wrapper_game"><div id="container_game">
	<div id="header_game">
		<div id="header_values_gold">1 234 567</div>
		<div id="header_values_ruby">42</div>
		<div id="header_values_level">87</div>
		<div id="header_values_hp">HP 1200 / 1500</div>
		<div id="header_values_xp">XP 40 %</div>
		<div id="cooldown_bar_expedition" class="cooldown_bar"><a href="#">Expedition</a></div>
		<div id="cooldown_bar_dungeon" class="cooldown_bar"><a href="#">Dungeon</a></div>
		<div id="cooldown_bar_arena" class="cooldown_bar"><a href="#">Arena</a></div>
		<div id="cooldown_bar_ct" class="cooldown_bar"><a href="#">Circus</a></div>
		<ul id="mainnav"><li><table><tr>${[1, 2, 3, 4, 5, 6].map((n) => `<td><a href="#">Sub-tab ${n}</a></td>`).join('')}</tr></table></li></ul>
	</div>
	<div id="main"><div id="main_inner">
		<div id="sidebar"><div id="sidebar_inner"><div id="mainmenu">
			${['Overview', 'Messages', 'Pantheon', 'Guild', 'Highscore'].map((m) => `<a class="menuitem" href="#">${m}</a>`).join('')}
		</div></div></div>
		<div id="content">${CONTENT[bodyId] || ''}</div>
	</div></div>
	<div id="footer"><div id="footer_inner"><a href="#">Legal notice</a></div></div>
</div><div id="banner_right"></div></div>
</body></html>`;
}

export function gameUrl(mod) {
	return `${GAME_URL}?mod=${mod}&sh=SESSION`;
}

// Layout facts the tests assert on, read in the page.
export function measure() {
	const html = document.documentElement;
	const rect = (sel) => {
		const el = document.querySelector(sel);
		if (!el) return null;
		const r = el.getBoundingClientRect();
		return { left: r.left, right: r.right, top: r.top, width: r.width, height: r.height, display: getComputedStyle(el).display };
	};
	return {
		classes: html.className,
		viewport: (document.querySelector('meta[name=viewport]') || {}).content || null,
		layoutWidth: html.clientWidth,
		scrollWidth: html.scrollWidth,
		menuOpen: html.classList.contains('gfm-menu-open'),
		button: rect('#gfm-menu-button'),
		sidebar: rect('#sidebar'),
		content: rect('#content'),
		container: rect('#container_game'),
		tableWrapped: !!document.querySelector('.gfm-scroll > #wide_table'),
		boxes: [...document.querySelectorAll('#expedition_list .expedition_box')].map((b) => b.getBoundingClientRect().top),
	};
}
