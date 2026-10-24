// Strips secrets from a saved game page so it can be used as a local fixture.
// Fixtures stay git-ignored anyway (they contain Gameforge assets); this only
// keeps session tokens off your disk copies and out of screenshots/bug reports.
//
//   node scripts/sanitize-fixture.mjs fixtures/expedition/expedition.html [...more]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function sanitize(html) {
	return html
		.replace(/([?&;]|&amp;)sh=[0-9a-f]{32}/g, '$1sh=SESSION')
		.replace(/(<meta name="csrf-token" content=")[^"]*/g, '$1CSRF')
		.replace(/(secureHash\s*=\s*["'])[0-9a-f]+/g, '$1SESSION')
		.replace(/(saved from url=\(\d+\))\S+/g, '$1about:blank');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	for (const file of process.argv.slice(2)) {
		writeFileSync(file, sanitize(readFileSync(file, 'utf8')));
		console.log('sanitized', file);
	}
}
