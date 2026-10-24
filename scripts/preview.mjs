// Local preview of the saved game pages in fixtures/ with GfM applied
// (docs/ROADMAP.md, next steps 1).
//
//   npm run preview            → http://127.0.0.1:8560/
//   node scripts/preview.mjs --port 9000
//
// Each page is served with the add-on's CSS and JS injected at the top of
// <head>, the way the content script runs at document_start. The page's own
// <script> tags are removed: a saved page is a snapshot of the DOM after the
// game and GCA scripts ran, so running them again would apply GCA twice and
// make the page try to reach the game server.
//
// Query options on any page:
//   ?gfm=0        the page without GfM (before/after comparison)
//   ?scripts=1    keep the page's own scripts
//   ?mod=x&submod=y  override the page detection (default: from body#id)
//
// Local only: fixtures contain Gameforge assets and are never published.
import { createServer } from 'node:http';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readBundle } from './build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURES = join(root, 'fixtures');
export const SHOTS_DIR = '_shots';
export const PREVIEW_HOST = 'https://s1-en.gladiatus.gameforge.com';

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.htm': 'text/html; charset=utf-8',
	'.css': 'text/css',
	'.js': 'text/javascript',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
};

/** body#id of a saved page → game mod: "guildMarketPage" → "guildMarket" */
export function pageMod(html) {
	const body = /<body[^>]*\bid="([^"]+)"/i.exec(html);
	return body ? body[1].replace(/Page$/, '') : 'overview';
}

export function stripScripts(html) {
	return html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
}

/**
 * Inject GfM into a saved page. detect() is pointed at a game URL for the
 * page's mod, because the real URL is 127.0.0.1.
 * @param {string} html
 * @param {{ mod?: string, submod?: string, scripts?: boolean, bundle?: { css: string, js: string } }} [options]
 */
export function injectGfm(html, options = {}) {
	const { css, js } = options.bundle || readBundle();
	const page = new URL(PREVIEW_HOST + '/game/index.php');
	page.searchParams.set('mod', options.mod || pageMod(html));
	if (options.submod) page.searchParams.set('submod', options.submod);

	// boot.js reads the URL, so the override goes between pages.js and boot.js
	const marker = '// content/boot.js';
	if (!js.includes(marker)) throw new Error('preview: boot.js not found in the bundle');
	const override = '// preview: detect the saved page\'s mod instead of 127.0.0.1\n' +
		'(function (pages, url) { const real = pages.detect; pages.detect = function () { return real(url); }; })' +
		`(globalThis.gfmPages, ${JSON.stringify(page.href)});\n`;

	// "</" inside the inlined source would end the <script>/<style> element early
	const safe = (text) => text.replace(/<\/(script|style)/gi, '<\\/$1');
	const inject = [
		'<style id="gfm-style">', safe(css), '</style>',
		'<script id="gfm-preview">', safe(js.replace(marker, override + marker)), '</script>',
	].join('\n');

	const out = options.scripts ? html : stripScripts(html);
	const head = /<head(\s[^>]*)?>/i.exec(out);
	return head
		? out.slice(0, head.index + head[0].length) + '\n' + inject + '\n' + out.slice(head.index + head[0].length)
		: inject + '\n' + out;
}

/** Saved pages under fixtures/, as paths relative to it with forward slashes. */
export function listFixtures(dir = FIXTURES) {
	if (!existsSync(dir)) return [];
	const walk = (d) => readdirSync(d).flatMap((name) => {
		const path = join(d, name);
		if (statSync(path).isDirectory()) {
			return name.endsWith('_files') || name === SHOTS_DIR ? [] : walk(path);
		}
		return /\.html?$/.test(name) ? [relative(dir, path).split(sep).join('/')] : [];
	});
	return walk(dir).sort();
}

function indexPage(files) {
	const rows = files.map((f) => `<li><a href="/${encodeURI(f)}">${f}</a> <a class="off" href="/${encodeURI(f)}?gfm=0">without GfM</a></li>`);
	const shots = existsSync(join(FIXTURES, SHOTS_DIR, 'index.html'))
		? `<p><a href="/${SHOTS_DIR}/index.html">Screenshots</a></p>` : '';
	return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GfM preview</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:16px;background:#f6f1e1;color:#2b1d10}a{color:#6b3d10}li{margin:6px 0}.off{font-size:13px;margin-left:8px;opacity:.7}</style>
<h1>GfM preview</h1>
${files.length ? `<ul>${rows.join('')}</ul>` : '<p>No saved pages in <code>fixtures/</code>. See CONTRIBUTING.md, "Adding or fixing a page".</p>'}
${shots}`;
}

export function startServer({ port = 8560, host = '127.0.0.1', dir = FIXTURES } = {}) {
	const server = createServer((req, res) => {
		const url = new URL(req.url, 'http://localhost');
		if (url.pathname === '/') {
			res.writeHead(200, { 'content-type': TYPES['.html'] });
			res.end(indexPage(listFixtures(dir)));
			return;
		}
		const file = normalize(join(dir, decodeURIComponent(url.pathname)));
		if (!file.startsWith(dir + sep) || !existsSync(file) || !statSync(file).isFile()) {
			res.writeHead(404, { 'content-type': 'text/plain' });
			res.end('not found');
			return;
		}
		const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
		res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
		const isPage = /\.html?$/i.test(file) && !relative(dir, file).startsWith(SHOTS_DIR);
		if (isPage && url.searchParams.get('gfm') !== '0') {
			res.end(injectGfm(readFileSync(file, 'utf8'), {
				mod: url.searchParams.get('mod') || undefined,
				submod: url.searchParams.get('submod') || undefined,
				scripts: url.searchParams.get('scripts') === '1',
			}));
		} else if (isPage) {
			res.end(url.searchParams.get('scripts') === '1' ? readFileSync(file) : stripScripts(readFileSync(file, 'utf8')));
		} else {
			res.end(readFileSync(file));
		}
	});
	return new Promise((resolve) => server.listen(port, host, () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const i = process.argv.indexOf('--port');
	const port = i > 0 ? Number(process.argv[i + 1]) : 8560;
	const server = await startServer({ port });
	const { port: actual } = server.address();
	console.log(`GfM preview: http://127.0.0.1:${actual}/  (${listFixtures().length} saved pages)`);
	console.log('Open it in Firefox responsive design mode (Ctrl+Shift+M) at 360-412 px.');
}
