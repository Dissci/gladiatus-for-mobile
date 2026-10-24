// Enforces the presentation-only rule (docs/ANALYSIS.md §2.2-2.3).
// If this test blocks your change, the change is probably out of scope:
// read CONTRIBUTING.md before adding an exception.
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const { join, relative } = require('node:path');

const SRC = join(__dirname, '..', 'src');

// The only file allowed to dispatch pointer events (one user gesture = one drag).
const INPUT_ADAPTER = 'content/input-adapter.js';

const FORBIDDEN = [
	[/\bfetch\s*\(/, 'network request (fetch)'],
	[/XMLHttpRequest/, 'network request (XHR)'],
	[/sendBeacon/, 'network request (beacon)'],
	[/\bWebSocket\b/, 'network connection (WebSocket)'],
	[/\$\.(ajax|get|post|getJSON)\b|jQuery\.(ajax|get|post|getJSON)\b/, 'network request (jQuery)'],
	[/\.click\s*\(\s*\)/, 'synthetic click'],
	[/\.submit\s*\(/, 'form submit'],
	[/\.requestSubmit\s*\(/, 'form submit'],
	[/\bsetInterval\s*\(/, 'timer loop (automatism)'],
	[/\beval\s*\(|new Function\s*\(/, 'dynamic code'],
	[/\bimport\s*\(\s*['"`]https?:/, 'remote code'],
	[/location\s*(\.href)?\s*=[^=]|location\.(assign|replace|reload)\s*\(/, 'navigation on the player\'s behalf'],
	[/\.trigger\s*\(/, 'jQuery event trigger'],
];
const ADAPTER_ONLY = [
	[/dispatchEvent\s*\(/, 'synthetic event'],
	[/new\s+(Mouse|Pointer|Touch)Event\s*\(/, 'synthetic pointer event'],
];

function files(dir) {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		return statSync(path).isDirectory() ? files(path) : [path];
	});
}

test('src/ contains no automation or network code', () => {
	const problems = [];
	for (const file of files(SRC).filter((f) => /\.(js|mjs)$/.test(f))) {
		const rel = relative(SRC, file).replace(/\\/g, '/');
		const code = readFileSync(file, 'utf8');
		const rules = rel === INPUT_ADAPTER ? FORBIDDEN : FORBIDDEN.concat(ADAPTER_ONLY);
		for (const [pattern, what] of rules) {
			if (pattern.test(code)) problems.push(`${rel}: ${what}`);
		}
	}
	assert.deepEqual(problems, []);
});

test('manifest asks for no permissions and no extra hosts', () => {
	const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
	assert.deepEqual(manifest.permissions || [], []);
	assert.equal(manifest.host_permissions, undefined);
	assert.equal(manifest.background, undefined);
	assert.equal(manifest.externally_connectable, undefined);
	for (const script of manifest.content_scripts) {
		assert.deepEqual(script.matches, ['https://*.gladiatus.gameforge.com/game/index.php*']);
	}
});

test('every file the manifest lists exists', () => {
	const manifest = JSON.parse(readFileSync(join(SRC, 'manifest.json'), 'utf8'));
	for (const script of manifest.content_scripts) {
		for (const f of [...script.js, ...script.css]) {
			assert.ok(statSync(join(SRC, f)).isFile(), f);
		}
	}
});

test('styles never scale elements (breaks drag-and-drop math)', () => {
	const problems = [];
	for (const file of files(SRC).filter((f) => f.endsWith('.css'))) {
		const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		if (/transform\s*:[^;]*scale/.test(css) || /(^|[\s;{])zoom\s*:/.test(css)) {
			problems.push(relative(SRC, file));
		}
	}
	assert.deepEqual(problems, []);
});
