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
.cooldown_bar_fill { position: absolute; left: 2px; top: 1px; width: 100%; height: 16px; }
.cooldown_bar_link { position: absolute; left: 0; top: 0; width: 138px; height: 20px; }
#header_values_hp_percent { position: absolute; left: 360px; top: 0; width: 30px; }
#mmonetbar { position: absolute; top: 0; left: 0; width: 100%; z-index: 30000; }
.headericon_big { width: 25px; height: 25px; float: left; margin-right: 5px; }
#mmoContent { position: relative; width: 585px; height: 32px; }
#mmoGame { width: 432px; }
#banner_event { position: absolute; left: 353px; top: 118px; width: 400px; height: 60px; }
#banner_event_link { display: block; width: 400px; height: 60px; }
`;

// The few Gladiatus Crazy Addon rules GfM has to undo (GCA is GPL-3.0,
// github.com/DinoDevs/GladiatusCrazyAddon, source/core/resources/style_gca.css):
// the "top fixed bar" state after scrolling, and the moved event bar.
const GCA_CSS = `
#topFixedBar { z-index: 900; position: fixed; top: 0; left: 0; right: 0; height: 24px; display: none; line-height: 24px; }
.bar-fixed-bar { display: inline !important; }
@media screen and (max-width: 1080px) { #topFixedBar a { font-size: 10px; width: 110px; line-height: 12px; text-align: center; display: inline-block; } }
.icon_gold-fixed-bar, .icon_rubies-fixed-bar { z-index: 901; position: fixed; top: 3px; }
.gold_val-fixed-bar, .ruby_val-fixed-bar { z-index: 901; position: fixed; top: 3px; margin-left: 18px; }
#header_values_hp.header_values_hp-fixed-bar { z-index: 901; position: fixed; top: 6px; margin-left: 90px; left: auto; }
.event_bar_moved #mainnav { bottom: -25px !important; }
.event_bar_moved #content { margin-top: 25px !important; }
.event_bar_moved #banner_event { top: 155px !important; z-index: 299 !important; }
.glfix.event_bar_moved #banner_event { top: 152px !important; }
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
 * @param {{ beforeHead?: string, gca?: boolean }} [options] beforeHead: markup placed before <head>,
 *   where a document-start script runs; gca: GCA's classes, elements and rules, in the scrolled state
 */
export function shellPage(bodyId, options = {}) {
	const gca = options.gca;
	return `<!doctype html>
<html${gca ? ' class="glfix event_bar_moved"' : ''}>${options.beforeHead || ''}<head><meta charset="utf-8"><title>GfM test shell</title><style>${GAME_CSS}${gca ? GCA_CSS : ''}</style></head>
<body id="${bodyId}">
<div id="mmonetbar"><div id="mmoContent"><a id="mmoLogo" href="#">Gameforge</a><div id="mmoGame">More games</div></div></div>
<div id="wrapper_game"><div id="container_game">
	<div id="banner_event"><a id="banner_event_link" href="#"></a></div>
	<div id="header_game">
		<div id="header_values_gold"><div id="icon_gold" class="headericon_big${gca ? ' icon_gold-fixed-bar' : ''}"></div><span id="sstat_gold_val"${gca ? ' class="gold_val-fixed-bar"' : ''}>1 234 567</span></div>
		<div id="header_values_ruby"><div id="icon_rubies" class="headericon_big${gca ? ' icon_rubies-fixed-bar' : ''}"></div><span id="sstat_ruby_val"${gca ? ' class="ruby_val-fixed-bar"' : ''}>42</span></div>
		<div id="header_values_level">87</div>
		<div id="header_values_hp"${gca ? ' class="header_values_hp-fixed-bar"' : ''}><div id="header_values_hp_percent">80%</div>HP 1200 / 1500</div>
		<div id="header_values_xp">XP 40 %</div>
		${['expedition', 'dungeon', 'arena', 'ct'].map((c) => `<div id="cooldown_bar_${c}" class="cooldown_bar"><div class="cooldown_bar_fill"></div><a class="cooldown_bar_link" href="#"></a>${c}</div>`).join('\n\t\t')}
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
${gca ? '<div id="topFixedBar" class="bar-fixed-bar"><a href="#">Gladiatus Crazy Addon</a><a class="scroll-to-top">▲</a></div>' : ''}
</body></html>`;
}

export function gameUrl(mod, { gca = false } = {}) {
	return `${GAME_URL}?mod=${mod}&sh=SESSION${gca ? '&gca=1' : ''}`;
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
	// how far content reaches past the right edge outside a scroll box: with
	// overflow-x:hidden that content is cut off, and scrollWidth does not show it.
	// #content's last-resort scroll does not count as a scroll box.
	const inScrollBox = (el) => {
		for (let e = el.parentElement; e && e !== document.body && e.id !== 'content'; e = e.parentElement) {
			if (/auto|scroll/.test(getComputedStyle(e).overflowX)) return true;
		}
		return false;
	};
	let clipped = 0;
	let clippedBy = null;
	for (const el of document.body.querySelectorAll('*')) {
		const r = el.getBoundingClientRect();
		if (!r.width || !r.height || r.right <= html.clientWidth + 1 || r.left >= html.clientWidth || inScrollBox(el)) continue;
		if (r.right - html.clientWidth > clipped) {
			clipped = Math.round(r.right - html.clientWidth);
			clippedBy = el.id || el.className;
		}
	}
	// header values that overlap each other or the event banner
	const boxes = [...document.querySelectorAll('#header_game [id^="sstat_"], #header_game [id^="icon_"], #header_values_hp, #header_values_xp, #header_game .cooldown_bar, #banner_event')]
		.map((el) => ({ id: el.id, r: el.getBoundingClientRect() }))
		.filter((b) => b.r.width && b.r.height);
	const overlaps = [];
	for (let i = 0; i < boxes.length; i++) {
		for (let j = i + 1; j < boxes.length; j++) {
			const a = boxes[i].r;
			const b = boxes[j].r;
			const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
			const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
			if (w > 2 && h > 2) overlaps.push(`${boxes[i].id} × ${boxes[j].id}`);
		}
	}
	const button = document.getElementById('gfm-menu-button');
	const b = button && button.getBoundingClientRect();
	const atButton = b && document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
	const fixedBar = document.getElementById('topFixedBar');
	return {
		classes: html.className,
		overlaps,
		buttonOnTop: !!atButton && atButton === button,
		atButton: atButton && (atButton.id || atButton.className),
		fixedBarShown: !!fixedBar && getComputedStyle(fixedBar).display !== 'none',
		clipped,
		clippedBy,
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
