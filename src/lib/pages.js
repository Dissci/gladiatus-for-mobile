/*
 * Page detection: game URL → { page, mode }.
 *
 * Runs at document_start, before <body> exists, so it uses only the URL
 * (mod / submod). Pure function, no DOM access, unit-tested in Node.
 *
 * Modes (docs/ANALYSIS.md §4.1):
 *   fit   – viewport width=FIT_WIDTH, native 540 px content, browser-scaled.
 *           For pages with drag-and-drop grids, the doll or image maps.
 *   fluid – viewport device-width, content reflowed to 100 %.
 * Unknown pages are "fit": it cannot break a page, only make it small.
 *
 * Exported on globalThis, not window: in a Firefox content script the global
 * is a sandbox and window is a separate (Xray) object.
 */
(function (root) {
	'use strict';

	const FIT_WIDTH = 560;

	// mod → mode, optional per-submod overrides
	const MODES = {
		overview:          { mode: 'fit', submods: { stats: 'fluid', achievements: 'fluid', buddylist: 'fluid' } },
		player:            { mode: 'fit' },
		dungeon:           { mode: 'fit' },
		inventory:         { mode: 'fit' },
		packages:          { mode: 'fit' },
		auction:           { mode: 'fit' },
		market:            { mode: 'fit' },
		guildMarket:       { mode: 'fit' },
		guildStorage:      { mode: 'fit' },
		forge:             { mode: 'fit' },
		map:               { mode: 'fit' },

		location:          { mode: 'fluid' },
		reports:           { mode: 'fluid' },
		arena:             { mode: 'fluid' },
		highscore:         { mode: 'fluid' },
		quests:            { mode: 'fluid' },
		missions:          { mode: 'fluid' },
		gods:              { mode: 'fluid' },
		messages:          { mode: 'fluid' },
		memo:              { mode: 'fluid' },
		news:              { mode: 'fluid' },
		guild:             { mode: 'fluid' },
		guildBankingHouse: { mode: 'fluid' },
		guildLibrary:      { mode: 'fluid' },
		guild_medic:       { mode: 'fluid' },
		guild_jail:        { mode: 'fluid' },
		guild_warcamp:     { mode: 'fluid' },
		training:          { mode: 'fluid' },
		work:              { mode: 'fluid' },
		costumes:          { mode: 'fluid' },
		settings:          { mode: 'fluid' },
		stuff:             { mode: 'fluid' },
	};

	/** @param {string} href full page URL */
	function detect(href) {
		let url;
		try {
			url = new URL(href);
		} catch (e) {
			return null;
		}
		if (!/\.gladiatus\.gameforge\.com$/.test(url.hostname) || url.pathname !== '/game/index.php') {
			return null;
		}
		const mod = url.searchParams.get('mod') || 'overview';
		const submod = url.searchParams.get('submod') || '';
		const entry = Object.prototype.hasOwnProperty.call(MODES, mod) ? MODES[mod] : null;
		const mode = (entry && entry.submods && entry.submods[submod]) || (entry && entry.mode) || 'fit';
		return {
			page: mod.replace(/[^a-zA-Z0-9_-]/g, ''),
			mode: mode,
			known: !!entry,
		};
	}

	function viewportContent(mode) {
		return mode === 'fluid'
			? 'width=device-width, initial-scale=1'
			: 'width=' + FIT_WIDTH;
	}

	const api = { detect: detect, viewportContent: viewportContent, FIT_WIDTH: FIT_WIDTH, MODES: MODES };
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = api;
	} else {
		root.gfmPages = api;
	}
})(globalThis);
