// Images, fonts and stylesheets for the saved pages, so the preview and the
// screenshots look like the game (docs/ROADMAP.md, testing).
//
// Saved pages reference the game's public files: `/cdn/img/...` on the game
// server (root-relative, so they would hit the preview server), images on
// *.geo.gfsrv.net, and, in GCA's stylesheet, paths relative to GCA's own
// resources folder. Each file is downloaded once, without cookies or any
// session, into fixtures/_assets/ (git-ignored: Gameforge assets and GCA's
// GPL files are never committed), and served from there afterwards.
//
// Dev tooling only: the add-on itself never makes a request.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, sep } from 'node:path';

// a server that answers /cdn/ without a redirect (s1-en redirects to the lobby)
export const GAME_ASSET_ORIGIN = 'https://s311-en.gladiatus.gameforge.com';
export const ASSETS_DIR = '_assets';

const TYPES = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.webp': 'image/webp',
	'.ico': 'image/x-icon',
	'.css': 'text/css',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
	'.ttf': 'font/ttf',
};

/** Only these hosts, only static file types. */
export function isAllowedAsset(url) {
	let u;
	try {
		u = new URL(url);
	} catch {
		return false;
	}
	if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
	if (!TYPES[extname(u.pathname).toLowerCase()]) return false;
	if (/\.gladiatus\.gameforge\.com$/.test(u.hostname)) return u.pathname.startsWith('/cdn/');
	if (/^gf\d\.geo\.gfsrv\.net$/.test(u.hostname)) return true;
	return u.hostname === 'raw.githubusercontent.com' && u.pathname.startsWith('/DinoDevs/GladiatusCrazyAddon/');
}

/** Where a URL is cached: fixtures/_assets/<host>/<path>. Game servers share one folder. */
export function cachePath(url, fixtures) {
	const u = new URL(url);
	const host = /\.gladiatus\.gameforge\.com$/.test(u.hostname) ? 'gladiatus' : u.hostname;
	const root = join(fixtures, ASSETS_DIR);
	const file = normalize(join(root, host, decodeURIComponent(u.pathname)));
	if (!file.startsWith(root + sep)) throw new Error(`bad asset path: ${url}`);
	return file;
}

/**
 * The file for an asset URL: from the cache, else downloaded once.
 * @returns {Promise<{ type: string, body: Buffer } | null>} null when not allowed or not found
 */
export async function getAsset(url, fixtures, { offline = false } = {}) {
	if (!isAllowedAsset(url)) return null;
	const file = cachePath(url, fixtures);
	const type = TYPES[extname(file).toLowerCase()];
	// a remembered 404, so missing files are not asked for on every run
	if (existsSync(file + '.missing')) return null;
	if (existsSync(file)) return { type, body: readFileSync(file) };
	if (offline) return null;
	let res;
	try {
		res = await fetch(url, { redirect: 'error', credentials: 'omit' });
	} catch {
		return null; // offline or redirected: leave it uncached and try next time
	}
	mkdirSync(dirname(file), { recursive: true });
	if (!res.ok) {
		if (res.status === 404 || res.status === 410) writeFileSync(file + '.missing', String(res.status));
		return null;
	}
	const body = Buffer.from(await res.arrayBuffer());
	writeFileSync(file, body);
	return { type, body };
}
