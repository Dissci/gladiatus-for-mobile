// Screenshots of every saved page in fixtures/ at phone widths, compared with
// the last approved set, so a fix on one page that breaks another shows up
// at once (docs/ROADMAP.md, testing). Uses Chrome phone emulation, because
// desktop Firefox ignores <meta name=viewport>.
//
//   npm run shots                     all pages × 360 / 390 / 412 px
//   npm run shots -- expedition 390   only pages whose path contains "expedition", at 390 px
//   npm run shots -- --approve        the last run becomes the baseline (same filters work)
//
// Each view is taken with GfM and GCA's stylesheet (compared), and without
// GfM (for reference, not compared). The saved pages were made with GCA, so
// they contain GCA's HTML: without GCA's stylesheet they show GCA's panels
// unstyled, which no player ever sees. GfM without GCA is covered by the
// browser tests (tests/e2e/). Images come from fixtures/_assets/
// (scripts/assets.mjs); anything else outside the preview server is blocked.
//
// Output in fixtures/_shots/: current/ (this run), baseline/ (approved),
// diff/ (red where a view changed), index.html (changed views first; open it
// through `npm run preview`), and a summary plus a sideways-overflow report
// on stdout. Local only: the images show Gameforge assets.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer';
import { getAsset } from './assets.mjs';
import { comparePng } from './compare.mjs';
import { FIXTURES, SHOTS_DIR, listFixtures, startServer } from './preview.mjs';

const WIDTHS = [360, 390, 412];
const VARIANTS = { gca: '?gca=1', off: '?gfm=0&gca=1' };
const COMPARED = ['gca'];

const args = process.argv.slice(2);
const approve = args.includes('--approve');
const widths = args.filter((a) => /^\d+$/.test(a)).map(Number);
const filters = args.filter((a) => !/^\d+$/.test(a) && !a.startsWith('--'));

const out = join(FIXTURES, SHOTS_DIR);
const dirs = { current: join(out, 'current'), baseline: join(out, 'baseline'), diff: join(out, 'diff') };
const slug = (file) => file.replace(/\.html?$/, '').replace(/\//g, '__');

if (approve) {
	// the last run, filtered like a run: page path and width
	if (!existsSync(dirs.current)) {
		console.error('Nothing to approve: run `npm run shots` first.');
		process.exit(1);
	}
	mkdirSync(dirs.baseline, { recursive: true });
	const names = readdirSync(dirs.current).filter((n) => COMPARED.some((v) => n.endsWith(`-${v}.png`))
		&& (!filters.length || filters.some((x) => n.includes(slug(x))))
		&& (!widths.length || widths.some((w) => n.includes(`-${w}-`))));
	for (const n of names) copyFileSync(join(dirs.current, n), join(dirs.baseline, n));
	console.log(`${names.length} views approved as the new baseline.`);
	process.exit(0);
}

const pages = listFixtures().filter((f) => !filters.length || filters.some((x) => f.includes(x)));
if (!pages.length) {
	console.error('No saved pages found in fixtures/. See CONTRIBUTING.md, "Adding or fixing a page".');
	process.exit(1);
}
for (const d of [dirs.current, dirs.diff]) rmSync(d, { recursive: true, force: true });
for (const d of Object.values(dirs)) mkdirSync(d, { recursive: true });

const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
// saved pages still reference the game and ad servers: images come from the
// cache, everything else outside the preview server is blocked
await page.setRequestInterception(true);
page.on('request', (r) => {
	const url = r.url();
	if (url.startsWith(base) || url.startsWith('data:')) return r.continue();
	getAsset(url, FIXTURES).then((asset) => (asset ? r.respond({ status: 200, contentType: asset.type, body: asset.body }) : r.abort()));
});

/** Load one view and take its screenshot. */
async function shoot(file, width, query) {
	await page.setViewport({ width, height: 800, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
	await page.goto(base + encodeURI(file) + query, { waitUntil: 'load', timeout: 60000 });
	// the same picture every run: lazy images loaded, no transitions, no caret
	await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }' });
	await page.evaluate(async () => {
		const images = [...document.images];
		for (const img of images) img.loading = 'eager';
		await Promise.all(images.filter((img) => !img.complete).map((img) => new Promise((done) => {
			img.addEventListener('load', done, { once: true });
			img.addEventListener('error', done, { once: true });
		})));
		await document.fonts.ready;
	});
	const m = await page.evaluate(() => {
		const layout = document.documentElement.clientWidth;
		// content cut off at the screen edge: overflow-x:hidden hides it from scrollWidth.
		// Anything inside its own scroll box (tables, #mainnav) is fine; the
		// last-resort scroll on #content itself is not.
		const scrolls = (el) => {
			for (let e = el.parentElement; e && e !== document.body && e.id !== 'content'; e = e.parentElement) {
				if (/auto|scroll/.test(getComputedStyle(e).overflowX)) return true;
			}
			return false;
		};
		let clipped = 0;
		let worst = '';
		for (const el of document.body.querySelectorAll('*')) {
			const r = el.getBoundingClientRect();
			if (!r.width || !r.height || r.right <= layout + 1 || r.left >= layout) continue;
			if (getComputedStyle(el).visibility === 'hidden' || scrolls(el)) continue;
			if (r.right - layout > clipped) {
				clipped = Math.round(r.right - layout);
				worst = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
			}
		}
		return {
			mode: (document.documentElement.className.match(/\bgfm-(fit|fluid)\b/) || [])[1] || '-',
			layout,
			scroll: document.documentElement.scrollWidth,
			clipped,
			worst,
		};
	});
	// a viewport as tall as the page instead of a full-page capture: fixed
	// elements (the dock) end up at the bottom instead of over the content
	const height = await page.evaluate(() => document.documentElement.scrollHeight);
	await page.setViewport({ width, height: Math.max(800, height), deviceScaleFactor: 1, isMobile: true, hasTouch: true });
	return { m, png: Buffer.from(await page.screenshot()) };
}

const rows = [];
let unstable = 0;
for (const file of pages) {
	for (const width of widths.length ? widths : WIDTHS) {
		const row = { file, width };
		for (const [variant, query] of Object.entries(VARIANTS)) {
			const name = `${slug(file)}-${width}-${variant}.png`;
			let { m, png } = await shoot(file, width, query);
			row[variant] = { ...m, name, status: 'reference' };
			const approved = join(dirs.baseline, name);
			if (!COMPARED.includes(variant)) {
				// reference only
			} else if (!existsSync(approved)) {
				row[variant].status = 'new';
			} else {
				let c = comparePng(readFileSync(approved), png);
				if (c.diff) {
					// a real change looks the same when taken again; render noise
					// (sub-pixel text positions) does not
					const again = await shoot(file, width, query);
					if (!comparePng(png, again.png).diff) {
						// stable: a real change
					} else if (!comparePng(readFileSync(approved), again.png).diff) {
						png = again.png;
						c = { diff: null };
					} else {
						unstable++;
					}
				}
				row[variant].status = c.diff ? 'changed' : 'same';
				row[variant].pixels = c.pixels;
				row[variant].sizeChanged = c.sizeChanged;
				if (c.diff) writeFileSync(join(dirs.diff, name), c.diff);
			}
			writeFileSync(join(dirs.current, name), png);
		}
		rows.push(row);
	}
}
await browser.close();
server.close();

// sideways scroll, or content cut off at the edge, whichever is worse
const overflow = (m) => Math.max(0, m.scroll - m.layout, m.clipped || 0);
const views = rows.flatMap((r) => COMPARED.map((v) => ({ ...r[v], file: r.file, width: r.width, variant: v })));
const label = (v) => `${v.file} · ${v.width} px`;
const img = (dir, name, caption) => `<figure><figcaption>${caption}</figcaption><a href="${dir}/${name}"><img src="${dir}/${name}" loading="lazy"></a></figure>`;
const note = (v) => (overflow(v) ? `<p class="bad">sticks out by ${overflow(v)} px (worst: ${v.worst})</p>` : '');
const changed = views.filter((v) => v.status === 'changed');
const added = views.filter((v) => v.status === 'new');
const same = views.filter((v) => v.status === 'same');

writeFileSync(join(out, 'index.html'), `<!doctype html><meta charset="utf-8"><title>GfM screenshots</title>
<style>body{font:14px system-ui,sans-serif;margin:16px;background:#f6f1e1;color:#2b1d10}section{margin:24px 0;padding-top:8px;border-top:1px solid #d8c99c}.row{display:flex;gap:16px;align-items:flex-start;overflow-x:auto}figure{margin:0}img{border:1px solid #b9a77a;max-width:390px}.bad{color:#a01818;font-weight:bold}summary{cursor:pointer;font-weight:bold}code{background:#ece2c0;padding:1px 4px}</style>
<h1>GfM screenshots</h1>
<p><b>${changed.length} changed</b>, ${added.length} new, ${same.length} unchanged (of ${views.length} compared views).
${changed.length || added.length ? 'If every change below is intended, approve them: <code>npm run shots -- --approve</code>' : ''}</p>
${changed.length ? '<h2>Changed</h2>' : ''}
${changed.map((v) => `<section><h3>${label(v)}</h3><p>${v.pixels} pixels differ${v.sizeChanged ? ', page size changed' : ''}</p>${note(v)}
<div class="row">${img('baseline', v.name, 'approved')}${img('current', v.name, 'now')}${img('diff', v.name, 'difference')}${img('current', v.name.replace(/-(gfm|gca)\.png$/, '-off.png'), 'without GfM')}</div></section>`).join('\n')}
${added.length ? '<h2>New (no approved screenshot yet)</h2>' : ''}
${added.map((v) => `<section><h3>${label(v)}</h3>${note(v)}<div class="row">${img('current', v.name, 'now')}${img('current', v.name.replace(/-(gfm|gca)\.png$/, '-off.png'), 'without GfM')}</div></section>`).join('\n')}
<details><summary>Unchanged (${same.length})</summary>
${same.map((v) => `<section><h3>${label(v)}</h3>${note(v)}<div class="row">${img('current', v.name, 'now')}</div></section>`).join('\n')}
</details>`);

console.log('page                                         width variant  overflow  worst element      screenshot');
for (const v of views) {
	const o = overflow(v);
	const shot = v.status === 'changed' ? `CHANGED (${v.pixels} px${v.sizeChanged ? ', size' : ''})` : v.status;
	console.log(`${v.file.padEnd(44).slice(0, 44)} ${String(v.width).padStart(5)} ${v.variant.padEnd(7)}  ${(o ? o + ' px' : 'ok').padEnd(8)}  ${(o ? v.worst : '').padEnd(17).slice(0, 17)}  ${shot}`);
}
const bad = (variant) => views.filter((v) => v.variant === variant && overflow(v)).length;
const count = rows.length;
console.log(`\nOverflow: ${bad('gca')} / ${count} views scroll sideways or cut content off.`);
console.log(`Screenshots: ${changed.length} changed, ${added.length} new, ${same.length} unchanged. Gallery: npm run preview → /${SHOTS_DIR}/index.html`);
if (unstable) console.log(`${unstable} of the changed views came out differently on a second take too: possibly render noise, check them by eye.`);
if (changed.length || added.length) console.log('If the changes are intended: npm run shots -- --approve');
