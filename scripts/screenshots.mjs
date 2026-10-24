// Screenshots of every saved page in fixtures/ at phone widths, with and
// without GfM (docs/ROADMAP.md, next steps 2). Uses Chrome phone emulation,
// because desktop Firefox ignores <meta name=viewport>.
//
//   npm run shots                     all pages × 360 / 390 / 412 px
//   npm run shots -- expedition 390   only pages whose path contains "expedition", at 390 px
//
// Output: fixtures/_shots/*.png, fixtures/_shots/index.html (side by side,
// open it through `npm run preview`) and a sideways-overflow report on stdout.
// Local only: the images show Gameforge assets.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { FIXTURES, SHOTS_DIR, listFixtures, startServer } from './preview.mjs';

const WIDTHS = [360, 390, 412];

const args = process.argv.slice(2);
const widths = args.filter((a) => /^\d+$/.test(a)).map(Number);
const filters = args.filter((a) => !/^\d+$/.test(a));
const pages = listFixtures().filter((f) => !filters.length || filters.some((x) => f.includes(x)));
if (!pages.length) {
	console.error('No saved pages found in fixtures/. See CONTRIBUTING.md, "Adding or fixing a page".');
	process.exit(1);
}

const out = join(FIXTURES, SHOTS_DIR);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
// saved pages still reference the game and ad servers: keep everything local
await page.setRequestInterception(true);
page.on('request', (r) => (r.url().startsWith(base) || r.url().startsWith('data:') ? r.continue() : r.abort()));

const rows = [];
for (const file of pages) {
	for (const width of widths.length ? widths : WIDTHS) {
		const row = { file, width };
		for (const gfm of [true, false]) {
			await page.setViewport({ width, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
			await page.goto(base + encodeURI(file) + (gfm ? '' : '?gfm=0'), { waitUntil: 'load', timeout: 30000 });
			const m = await page.evaluate(() => ({
				mode: (document.documentElement.className.match(/\bgfm-(fit|fluid)\b/) || [])[1] || '-',
				layout: document.documentElement.clientWidth,
				scroll: document.documentElement.scrollWidth,
			}));
			const name = `${file.replace(/\.html?$/, '').replace(/\//g, '__')}-${width}-${gfm ? 'gfm' : 'off'}.png`;
			await page.screenshot({ path: join(out, name), fullPage: true });
			row[gfm ? 'gfm' : 'off'] = { ...m, name };
		}
		rows.push(row);
	}
}
await browser.close();
server.close();

const overflow = (m) => Math.max(0, m.scroll - m.layout);
writeFileSync(join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>GfM screenshots</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;background:#f6f1e1}section{margin:24px 0}.pair{display:flex;gap:16px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{border:1px solid #b9a77a;max-width:420px}.bad{color:#a01818;font-weight:bold}</style>
<h1>GfM screenshots</h1>
${rows.map((r) => `<section><h2>${r.file} · ${r.width} px · ${r.gfm.mode}</h2>
<p class="${overflow(r.gfm) ? 'bad' : ''}">GfM: layout ${r.gfm.layout} px, page ${r.gfm.scroll} px${overflow(r.gfm) ? `, overflows by ${overflow(r.gfm)} px` : ''}</p>
<div class="pair"><figure><figcaption>GfM</figcaption><img src="${r.gfm.name}" loading="lazy"></figure>
<figure><figcaption>without</figcaption><img src="${r.off.name}" loading="lazy"></figure></div></section>`).join('\n')}`);

console.log('page                                         width mode  layout  overflow');
for (const r of rows) {
	console.log(`${r.file.padEnd(44).slice(0, 44)} ${String(r.width).padStart(5)} ${r.gfm.mode.padEnd(5)} ${String(r.gfm.layout).padStart(6)}  ${overflow(r.gfm) ? overflow(r.gfm) + ' px' : 'ok'}`);
}
const bad = rows.filter((r) => overflow(r.gfm)).length;
console.log(`\n${rows.length} views, ${bad} with sideways overflow. Gallery: npm run preview → /${SHOTS_DIR}/index.html`);
