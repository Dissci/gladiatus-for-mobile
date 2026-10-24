// Builds both delivery targets from src/ (docs/ANALYSIS.md §4.7):
//   dist/extension/                  MV3 WebExtension (copy of src/)
//   dist/gladiatus-for-mobile.user.js userscript with the CSS inlined
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const dist = join(root, 'dist');

// The content script's CSS and JS, concatenated in manifest order.
// Also used by scripts/preview.mjs, so the preview runs exactly what ships.
export function readBundle() {
	const manifest = JSON.parse(readFileSync(join(src, 'manifest.json'), 'utf8'));
	const [script] = manifest.content_scripts;
	const css = script.css.map((f) => `/* ${f} */\n` + readFileSync(join(src, f), 'utf8')).join('\n');
	const js = script.js.map((f) => `// ${f}\n` + readFileSync(join(src, f), 'utf8')).join('\n');
	return { manifest, script, css, js };
}

export function buildUserscript() {
	const { manifest, script, css, js } = readBundle();

	const header = [
		'// ==UserScript==',
		`// @name         ${manifest.name}`,
		'// @namespace    https://github.com/Dissci/gladiatus-for-mobile',
		`// @version      ${manifest.version}`,
		`// @description  ${manifest.description}`,
		'// @license      GPL-3.0-or-later',
		...script.matches.map((m) => `// @match        ${m}`),
		'// @run-at       document-start',
		'// @grant        none',
		'// @noframes',
		'// ==/UserScript==',
	].join('\n');

	// CSS goes in first so there is no flash of the desktop layout
	const injectCss = `(function () {\n\tconst style = document.createElement('style');\n\tstyle.id = 'gfm-style';\n\tstyle.textContent = ${JSON.stringify(css)};\n\t(document.head || document.documentElement).appendChild(style);\n})();`;

	return `${header}\n\n${injectCss}\n\n(function () {\n${js}\n})();\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	rmSync(dist, { recursive: true, force: true });
	mkdirSync(dist, { recursive: true });
	cpSync(src, join(dist, 'extension'), { recursive: true });
	writeFileSync(join(dist, 'gladiatus-for-mobile.user.js'), buildUserscript());
	console.log('built dist/extension and dist/gladiatus-for-mobile.user.js');
}
