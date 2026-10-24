import puppeteer from 'puppeteer';
import { startServer, listFixtures } from './scripts/preview.mjs';
const server = await startServer({ port: 0 });
const base = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (r) => (r.url().startsWith(base) ? r.continue() : r.abort()));
await page.setViewport({ width: 390, height: 800, isMobile: true, hasTouch: true });
const bad = [];
for (const f of listFixtures()) {
  await page.goto(base + f);
  for (const scrollY of [0, 600]) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    const hit = await page.evaluate(() => { const b = document.getElementById('gfm-menu-button').getBoundingClientRect(); const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return e && e.id; });
    if (hit !== 'gfm-menu-button') { bad.push(`${f} y=${scrollY}: button covered by ${hit}`); continue; }
    await page.tap('#gfm-menu-button');
    await page.waitForFunction(() => document.getElementById('sidebar').getBoundingClientRect().left >= -1, { timeout: 2000 }).catch(() => {});
    const r = await page.evaluate(() => { const e = document.elementFromPoint(60, 300); return { open: document.documentElement.classList.contains('gfm-menu-open'), inMenu: !!(e && e.closest('#sidebar')), at: e && (e.id || e.className) }; });
    if (!r.open || !r.inMenu) bad.push(`${f} y=${scrollY}: open=${r.open}, top element in drawer area: ${r.at}`);
    await page.tap('#gfm-menu-button');
  }
}
console.log(bad.length ? bad.join('\n') : 'drawer opens on all ' + listFixtures().length + ' pages, scrolled and not');
await page.goto(base + 'main_page.html'); await page.tap('#gfm-menu-button'); await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: 'C:/Users/Tomas/AppData/Local/Temp/claude/c--Users-Tomas-gladiatus-monkey/11e75ed8-6dd7-4a80-a8d4-7749238b58a2/scratchpad/drawer-open.png' });
await browser.close(); server.close();
