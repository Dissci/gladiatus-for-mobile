// The WebExtension in real Firefox: src/ installed as a temporary add-on, the
// game host answered with the test shell (no network). This is the only test
// that runs the content scripts in Firefox's sandbox, where `window` is not the
// global object (that bug once made the whole add-on a no-op).
//
// Desktop Firefox ignores <meta name=viewport>, so this checks that the tag is
// set; tests/e2e/chrome-userscript.test.mjs checks that it takes effect.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { GAME_URL, gameUrl, measure, shellPage } from './shell-page.mjs';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const BODY_ID = { location: 'locationPage', overview: 'overviewPage', dungeon: 'dungeonPage' };

let browser;
let page;

before(async () => {
	browser = await puppeteer.launch({ browser: 'firefox', headless: true });
	await browser.installExtension(SRC);
	page = await browser.newPage();
	// interception only starts reliably once the tab has a document
	await page.goto('about:blank');
	await page.setRequestInterception(true);
	page.on('request', (request) => {
		const url = new URL(request.url());
		if (request.url().startsWith(GAME_URL)) {
			const mod = url.searchParams.get('mod') || 'overview';
			request.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: shellPage(BODY_ID[mod] || 'overviewPage', { gca: url.searchParams.has('gca'), dialog: url.searchParams.has('dialog') }) });
		} else {
			request.abort();
		}
	});
});

after(async () => {
	await browser?.close();
});

async function open(mod, width, options) {
	await page.setViewport({ width, height: 800 });
	await page.goto(gameUrl(mod, options));
	return page.evaluate(measure);
}

test('fluid page: classes, viewport tag, no sideways scroll', async () => {
	const m = await open('location', 390);
	assert.equal(m.classes, 'gfm gfm-fluid gfm-page-location');
	assert.equal(m.viewport, 'width=device-width, initial-scale=1');
	assert.ok(m.scrollWidth <= m.layoutWidth, `page is ${m.scrollWidth} px wide in a ${m.layoutWidth} px viewport`);
	assert.ok(m.content.right <= m.layoutWidth, `#content ends at ${m.content.right}`);
	assert.equal(m.clipped, 0, `${m.clippedBy} is cut off by ${m.clipped} px`);
	assert.ok(m.tableWrapped, 'wide table is wrapped in .gfm-scroll');
});

test('fluid page: expedition cards in a 2×2 grid', async () => {
	const m = await open('location', 390);
	assert.equal(m.boxes.length, 4);
	assert.equal(m.boxes[0], m.boxes[1], 'cards 1 and 2 share a row');
	assert.ok(m.boxes[2] > m.boxes[0], 'card 3 starts a second row');
});

test('menu drawer opens and closes', async () => {
	let m = await open('location', 390);
	assert.ok(m.button.width >= 44 && m.button.height >= 44, 'menu button is a 44 px touch target');
	assert.ok(m.sidebar.right <= 0, 'drawer starts off screen');

	await page.click('#gfm-menu-button');
	await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().left >= 0);
	m = await page.evaluate(measure);
	assert.ok(m.menuOpen);
	assert.equal(await page.$eval('#gfm-menu-button', (b) => b.getAttribute('aria-expanded')), 'true');

	await page.mouse.click(370, 400); // the backdrop, right of the drawer
	await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().right <= 0);
	assert.equal((await page.evaluate(measure)).menuOpen, false);
});

test('menu button is on top of everything, also with GCA and scrolled', async () => {
	for (const gca of [false, true]) {
		let m = await open('location', 390, { gca });
		assert.ok(m.buttonOnTop, `gca=${gca}: ${m.atButton} covers the menu button`);
		await page.evaluate(() => window.scrollTo(0, 400));
		m = await page.evaluate(measure);
		assert.ok(m.buttonOnTop, `gca=${gca}, scrolled: ${m.atButton} covers the menu button`);
	}
	await page.click('#gfm-menu-button');
	await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().left >= 0);
	const inDrawer = await page.evaluate(() => !!document.elementFromPoint(60, 300).closest('#sidebar'));
	assert.ok(inDrawer, 'the open drawer is on top');
});

test('GCA: header values stay in the header, nothing overlaps', async () => {
	const m = await open('location', 390, { gca: true });
	assert.deepEqual(m.overlaps, []);
	assert.equal(m.fixedBarShown, false, "GCA's top fixed bar is hidden on phones");
	assert.equal(m.clipped, 0, `${m.clippedBy} is cut off by ${m.clipped} px`);
});

test('dock: HP, XP, points, ranks and cooldowns at the bottom, also with GCA and scrolled', async () => {
	for (const gca of [false, true]) {
		let m = await open('location', 390, { gca });
		assert.equal(m.dockCount, 10, `gca=${gca}: HP, XP, 2 points, 2 ranks, 4 cooldown bars`);
		assert.deepEqual(m.outOfDock, [], `gca=${gca}`);
		await page.evaluate(() => window.scrollTo(0, 400));
		m = await page.evaluate(measure);
		assert.deepEqual(m.outOfDock, [], `gca=${gca}, scrolled`);
	}
});

test('every sub-tab and an open dialog are on screen', async () => {
	const m = await open('location', 360, { dialog: true });
	assert.deepEqual(m.tabsOffScreen, [], 'tabs cut off at the edge');
	assert.deepEqual(m.dialogsOffScreen, [], 'dialog at its desktop position');
});

test('drawer entries are touch-sized buttons, not sprite slices', async () => {
	const m = await open('location', 390);
	assert.ok(m.menuItems.length > 0);
	for (const item of m.menuItems) {
		assert.ok(item.height >= 44, `entry is ${item.height} px tall`);
		assert.equal(item.sprite, false, "the game's 27 px sprite is replaced");
	}
});

test('fit page: native content width, fit viewport tag', async () => {
	const m = await open('overview', 390);
	assert.equal(m.classes, 'gfm gfm-fit gfm-page-overview');
	assert.equal(m.viewport, 'width=560');
	assert.equal(m.content.width, 540);
});

test('desktop width: the game layout is untouched', async () => {
	const m = await open('location', 1280);
	assert.equal(m.container.width, 920, '#container_game keeps 920 px');
	assert.equal(m.button.display, 'none', 'no menu button on desktop');
	assert.equal(m.boxes[0], m.boxes[3], 'cards stay in one row');
});
