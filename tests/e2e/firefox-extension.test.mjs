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
			request.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: shellPage(BODY_ID[mod] || 'overviewPage') });
		} else {
			request.abort();
		}
	});
});

after(async () => {
	await browser?.close();
});

async function open(mod, width) {
	await page.setViewport({ width, height: 800 });
	await page.goto(gameUrl(mod));
	return page.evaluate(measure);
}

test('fluid page: classes, viewport tag, no sideways scroll', async () => {
	const m = await open('location', 390);
	assert.equal(m.classes, 'gfm gfm-fluid gfm-page-location');
	assert.equal(m.viewport, 'width=device-width, initial-scale=1');
	assert.ok(m.scrollWidth <= m.layoutWidth, `page is ${m.scrollWidth} px wide in a ${m.layoutWidth} px viewport`);
	assert.ok(m.content.right <= m.layoutWidth, `#content ends at ${m.content.right}`);
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
