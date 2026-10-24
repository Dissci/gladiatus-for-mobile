// The userscript build in Chrome with phone emulation, which (unlike desktop
// Firefox) applies <meta name=viewport>. The script is placed before <head>,
// the state a userscript manager's document-start sees.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { buildUserscript } from '../../scripts/build.mjs';
import { GAME_URL, gameUrl, measure, shellPage } from './shell-page.mjs';

const BODY_ID = { location: 'locationPage', overview: 'overviewPage' };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

let browser;
let page;

before(async () => {
	const userscript = buildUserscript().replace(/<\/(script|style)/gi, '<\\/$1');
	browser = await puppeteer.launch({ headless: true });
	page = await browser.newPage();
	await page.setViewport(PHONE);
	await page.setRequestInterception(true);
	page.on('request', (request) => {
		if (request.url().startsWith(GAME_URL)) {
			const mod = new URL(request.url()).searchParams.get('mod') || 'overview';
			const body = shellPage(BODY_ID[mod] || 'overviewPage', { beforeHead: `<script>${userscript}</script>` });
			request.respond({ status: 200, contentType: 'text/html; charset=utf-8', body });
		} else {
			request.abort();
		}
	});
});

after(async () => {
	await browser?.close();
});

async function open(mod) {
	await page.goto(gameUrl(mod));
	return page.evaluate(measure);
}

test('fluid page lays out at the phone width without sideways scroll', async () => {
	const m = await open('location');
	assert.equal(m.classes, 'gfm gfm-fluid gfm-page-location');
	assert.equal(m.layoutWidth, 390);
	assert.ok(m.scrollWidth <= m.layoutWidth, `page is ${m.scrollWidth} px wide in a ${m.layoutWidth} px viewport`);
	assert.equal(m.clipped, 0, `${m.clippedBy} is cut off by ${m.clipped} px`);
});

test('fluid page fits at 360 px too', async () => {
	await page.setViewport({ ...PHONE, width: 360 });
	const m = await open('location');
	await page.setViewport(PHONE);
	assert.equal(m.layoutWidth, 360);
	assert.equal(m.clipped, 0, `${m.clippedBy} is cut off by ${m.clipped} px`);
});

test('fit page lays out at 560 px and fits it', async () => {
	const m = await open('overview');
	assert.equal(m.classes, 'gfm gfm-fit gfm-page-overview');
	assert.equal(m.layoutWidth, 560);
	assert.ok(m.scrollWidth <= m.layoutWidth, `page is ${m.scrollWidth} px wide in a ${m.layoutWidth} px viewport`);
	assert.equal(m.content.width, 540);
	assert.equal(m.clipped, 0, `${m.clippedBy} is cut off by ${m.clipped} px`);
});

test('menu drawer opens by tap', async () => {
	await open('location');
	await page.tap('#gfm-menu-button');
	await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().left >= 0);
	assert.ok((await page.evaluate(measure)).menuOpen);
});
