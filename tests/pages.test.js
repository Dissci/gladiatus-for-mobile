const test = require('node:test');
const assert = require('node:assert/strict');
const pages = require('../src/lib/pages.js');

const base = 'https://s311-en.gladiatus.gameforge.com/game/index.php?';

test('drag-and-drop pages use fit mode', () => {
	for (const q of ['mod=overview', 'mod=packages', 'mod=inventory&sub=3&subsub=1', 'mod=auction',
		'mod=guildMarket', 'mod=forge&submod=smeltery', 'mod=forge&submod=storage', 'mod=dungeon&loc=1']) {
		assert.equal(pages.detect(base + q + '&sh=x').mode, 'fit', q);
	}
});

test('list and text pages use fluid mode', () => {
	for (const q of ['mod=location&loc=6', 'mod=reports&submod=showCombatReport&t=0', 'mod=highscore',
		'mod=quests', 'mod=messages', 'mod=guild_medic', 'mod=arena&submod=grouparena', 'mod=overview&submod=stats']) {
		assert.equal(pages.detect(base + q + '&sh=x').mode, 'fluid', q);
	}
});

test('unknown pages default to fit and are marked unknown', () => {
	const info = pages.detect(base + 'mod=somethingNew');
	assert.deepEqual(info, { page: 'somethingNew', mode: 'fit', known: false });
});

test('missing mod is the overview', () => {
	assert.equal(pages.detect(base + 'sh=x').page, 'overview');
});

test('page name is safe for a CSS class', () => {
	assert.equal(pages.detect(base + 'mod=a"b<c').page, 'abc');
});

test('other hosts and paths are ignored', () => {
	assert.equal(pages.detect('https://lobby.gladiatus.gameforge.com/en_GB/'), null);
	assert.equal(pages.detect('https://evil.example/game/index.php?mod=overview'), null);
	assert.equal(pages.detect('https://s1-en.gladiatus.gameforge.com.evil.example/game/index.php'), null);
	assert.equal(pages.detect('not a url'), null);
});

test('viewport content per mode', () => {
	assert.equal(pages.viewportContent('fluid'), 'width=device-width, initial-scale=1');
	assert.equal(pages.viewportContent('fit'), 'width=' + pages.FIT_WIDTH);
});
