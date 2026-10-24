// Repository hygiene: no session tokens or game assets get committed,
// and the userscript build stays valid.
const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const ROOT = join(__dirname, '..');

function trackedFiles() {
	try {
		return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' })
			.split('\n').filter(Boolean);
	} catch (e) {
		return [];
	}
}

test('no session hashes or csrf tokens in the repository', () => {
	const leaks = trackedFiles().filter((f) => {
		if (/\.(png|jpg|gif|ico)$/.test(f)) return false;
		const text = readFileSync(join(ROOT, f), 'utf8');
		return /sh=[0-9a-f]{32}/.test(text) || /csrf-token" content="[0-9a-f]{32,}/.test(text);
	});
	assert.deepEqual(leaks, []);
});

test('no saved game pages or game assets are committed', () => {
	const assets = trackedFiles().filter((f) => /_files\/|\.stiahnuť$|^fixtures\//.test(f) || /\.html?$/.test(f));
	assert.deepEqual(assets, []);
});

test('userscript build has a valid header and inlines the CSS', async () => {
	const { buildUserscript } = await import('../scripts/build.mjs');
	const out = buildUserscript();
	assert.match(out, /^\/\/ ==UserScript==/);
	assert.match(out, /@run-at\s+document-start/);
	assert.match(out, /@grant\s+none/);
	assert.match(out, /@match\s+https:\/\/\*\.gladiatus\.gameforge\.com\/game\/index\.php\*/);
	assert.match(out, /gfm-menu-button/);
});

test('sanitizer removes session data', async () => {
	const { sanitize } = await import('../scripts/sanitize-fixture.mjs');
	// built at runtime so the hygiene test above does not flag this file
	const fakeHash = '0123456789abcdef'.repeat(2);
	const html = `<meta name="csrf-token" content="abc123"><a href="index.php?mod=x&amp;sh=${fakeHash}">`;
	const out = sanitize(html);
	assert.doesNotMatch(out, /0123456789abcdef/);
	assert.doesNotMatch(out, /abc123/);
});
