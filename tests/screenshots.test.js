// The screenshot tooling (scripts/assets.mjs, scripts/compare.mjs, GCA's
// image paths in scripts/preview.mjs). Dev tooling only, but a wrong cache
// rule would fetch from places it should not, and a wrong comparison would
// hide layout regressions.
const test = require('node:test');
const assert = require('node:assert/strict');
const { join } = require('node:path');
const { PNG } = require('pngjs');

const assets = () => import('../scripts/assets.mjs');

test('only static files from the game CDN, gfsrv and GCA are fetched', async () => {
	const { isAllowedAsset } = await assets();
	assert.ok(isAllowedAsset('https://s311-en.gladiatus.gameforge.com/cdn/img/menu.png'));
	assert.ok(isAllowedAsset('https://gf3.geo.gfsrv.net/cdnb1/5fd403b4efa8ea7bc3ca5a852bfce9.jpg'));
	assert.ok(isAllowedAsset('https://gf2.geo.gfsrv.net/cdnae/c326c1586bef7a0a9d7ef57b64648c.sprites'));
	assert.ok(isAllowedAsset('https://raw.githubusercontent.com/DinoDevs/GladiatusCrazyAddon/v4.3.12/source/core/resources/interface/menu_items.png'));
	// game pages, scripts, other hosts: never
	assert.ok(!isAllowedAsset('https://s311-en.gladiatus.gameforge.com/game/index.php?mod=overview'));
	assert.ok(!isAllowedAsset('https://s311-en.gladiatus.gameforge.com/cdn/js/game.js'));
	assert.ok(!isAllowedAsset('https://s311-en.gladiatus.gameforge.com/img/x.png'));
	assert.ok(!isAllowedAsset('https://ads.example.com/banner.png'));
	assert.ok(!isAllowedAsset('https://raw.githubusercontent.com/someone/else/x.png'));
	assert.ok(!isAllowedAsset('not a url'));
});

test('cache paths stay inside fixtures/_assets/, game servers share one folder', async () => {
	const { cachePath } = await assets();
	const root = join('/tmp', 'fixtures');
	assert.equal(cachePath('https://s311-en.gladiatus.gameforge.com/cdn/img/menu.png', root), join(root, '_assets', 'gladiatus', 'cdn', 'img', 'menu.png'));
	assert.equal(cachePath('https://s50-en.gladiatus.gameforge.com/cdn/img/menu.png', root), join(root, '_assets', 'gladiatus', 'cdn', 'img', 'menu.png'));
	assert.throws(() => cachePath('https://gf1.geo.gfsrv.net/..%2f..%2f..%2fx.png', root));
});

test("GCA's relative image paths point at the preview's GCA folder", async () => {
	const { gcaUrls } = await import('../scripts/preview.mjs');
	assert.equal(gcaUrls("a{background:url('interface/x.png') no-repeat}"), "a{background:url('/_gca/res/interface/x.png') no-repeat}");
	assert.equal(gcaUrls('a{background:url("icons/y.png")}'), 'a{background:url("/_gca/res/icons/y.png")}');
	assert.equal(gcaUrls('a{background:url(loading.gif)}'), 'a{background:url(/_gca/res/loading.gif)}');
	for (const kept of ['url(data:image/png;base64,AA)', 'url(/cdn/img/a.png)', 'url(https://x.org/a.png)', 'url(#f)']) {
		assert.equal(gcaUrls(`a{b:${kept}}`), `a{b:${kept}}`);
	}
});

function png(width, height, paint = () => [200, 180, 120, 255]) {
	const p = new PNG({ width, height });
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) p.data.set(paint(x, y), (y * width + x) * 4);
	}
	return PNG.sync.write(p);
}

test('comparison: identical, changed, and a different page height', async () => {
	const { comparePng } = await import('../scripts/compare.mjs');
	const same = comparePng(png(20, 20), png(20, 20));
	assert.equal(same.pixels, 0);
	assert.equal(same.diff, null);

	const box = comparePng(png(20, 20), png(20, 20, (x, y) => (x < 5 && y < 5 ? [0, 0, 0, 255] : [200, 180, 120, 255])));
	assert.equal(box.pixels, 25);
	assert.ok(box.diff, 'a difference image is written');

	const taller = comparePng(png(20, 20), png(20, 30));
	assert.equal(taller.sizeChanged, true);
	assert.ok(taller.diff);
});
