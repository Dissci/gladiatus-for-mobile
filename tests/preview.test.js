// The fixture preview (scripts/preview.mjs) must inject exactly what ships
// and must not re-run the saved page's own scripts.
const test = require('node:test');
const assert = require('node:assert/strict');

const preview = () => import('../scripts/preview.mjs');

const saved = '<!DOCTYPE html>\n<!--[if IE 6]><html class="ie6"><![endif]-->\n<html class="gca_enable_xscroll"><head><meta charset="utf-8">'
	+ '<script src="game.js"></script><script>window.x = 1;</script></head>'
	+ '<body id="guildMarketPage"><div id="content"></div><script type="text/javascript">later()</script></body></html>';

test('mod comes from body#id', async () => {
	const { pageMod } = await preview();
	assert.equal(pageMod(saved), 'guildMarket');
	assert.equal(pageMod('<body id="guild_medicPage">'), 'guild_medic');
	assert.equal(pageMod('<body class="x">'), 'overview');
});

test('GfM goes first in <head>, the page scripts are removed', async () => {
	const { injectGfm } = await preview();
	const out = injectGfm(saved);
	assert.ok(out.indexOf('id="gfm-style"') < out.indexOf('<meta charset'), 'GfM CSS comes before the page styles');
	assert.doesNotMatch(out, /src="game\.js"|window\.x = 1|later\(\)/);
	assert.match(out, /gfm-menu-button/, 'layout.js is included');
	assert.match(out, /mod=guildMarket/, 'detection points at the page\'s mod');
});

test('options: keep scripts, override mod', async () => {
	const { injectGfm } = await preview();
	const out = injectGfm(saved, { scripts: true, mod: 'auction', submod: 'x' });
	assert.match(out, /game\.js/);
	assert.match(out, /mod=auction&submod=x/);
});

test('the injected override makes detect() report the saved page', async () => {
	const { injectGfm } = await preview();
	const script = /<script id="gfm-preview">([\s\S]*?)<\/script>/.exec(injectGfm(saved))[1];
	// run pages.js + override + boot.js against a fake document
	const classes = [];
	const meta = {};
	const sandbox = {
		location: { href: 'http://127.0.0.1:8560/guild/guild_market.html' },
		document: {
			documentElement: { classList: { add: (...c) => classes.push(...c), contains: () => false }, prepend() {} },
			head: { prepend: (m) => Object.assign(meta, m) },
			createElement: () => ({}),
			readyState: 'complete',
			getElementById: () => null,
			querySelectorAll: () => [],
		},
	};
	sandbox.globalThis = sandbox;
	new Function(...Object.keys(sandbox), script)(...Object.values(sandbox));
	assert.deepEqual(classes, ['gfm', 'gfm-fit', 'gfm-page-guildMarket']);
	assert.equal(meta.content, 'width=560');
});

test('inlined source cannot close the injected elements early', async () => {
	const { injectGfm } = await preview();
	const out = injectGfm('<head></head>', { bundle: { css: 'a::after{content:"</style>"}', js: '// content/boot.js\nconst s = "</script>";' } });
	assert.equal(out.match(/<\/style>/g).length, 1);
	assert.equal(out.match(/<\/script>/g).length, 1);
});

test('GCA stylesheet goes to the top of <head> and cannot close its element early', async () => {
	const { withGca } = await preview();
	const out = withGca('<html><head><link rel="stylesheet" href="game.css"></head></html>', '#x { content: "</style>"; }');
	assert.ok(out.indexOf('id="gca-style"') < out.indexOf('game.css'));
	assert.equal(out.match(/<\/style>/g).length, 1);
});

test('a save without its _files folder gets the game stylesheets of another save', async () => {
	const { gameStylesheet } = await preview();
	const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs');
	const { join } = require('node:path');
	const { tmpdir } = require('node:os');
	const dir = mkdtempSync(join(tmpdir(), 'gfm-'));
	try {
		mkdirSync(join(dir, 'arena', 'arena_files'), { recursive: true });
		writeFileSync(join(dir, 'arena', 'arena_files', 'game_Nyn9.css'), 'a{}');
		writeFileSync(join(dir, 'arena', 'arena_files', 'sprites.css'), 'b{}');
		assert.equal(gameStylesheet(dir, join(dir, 'main_page_files', 'game.css')), join(dir, 'arena', 'arena_files', 'game_Nyn9.css'));
		assert.equal(gameStylesheet(dir, join(dir, 'main_page_files', 'sprites.css')), join(dir, 'arena', 'arena_files', 'sprites.css'));
		assert.equal(gameStylesheet(dir, join(dir, 'main_page_files', 'chat.css')), null, 'nothing to fall back to');
		assert.equal(gameStylesheet(dir, join(dir, 'main_page_files', 'game.js')), null, 'stylesheets only');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
