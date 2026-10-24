/*
 * document_start: tag <html> with the page and mode, set the viewport.
 * Presentation only: no game requests, no events, no timers.
 */
(function () {
	'use strict';

	const pages = globalThis.gfmPages;
	const info = pages && pages.detect(location.href);
	if (!info) return;

	const html = document.documentElement;
	html.classList.add('gfm', 'gfm-' + info.mode, 'gfm-page-' + info.page);

	const meta = document.createElement('meta');
	meta.name = 'viewport';
	meta.content = pages.viewportContent(info.mode);
	// <head> may not be parsed yet at document_start
	(document.head || html).prepend(meta);
})();
