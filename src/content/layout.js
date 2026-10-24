/*
 * DOMContentLoaded: small DOM additions CSS cannot do.
 *  - a menu button that toggles the sidebar drawer (a class on <html>, never a game request)
 *  - scroll wrappers around wide tables on fluid pages
 * Listeners are only attached to our own elements.
 */
(function () {
	'use strict';

	const html = document.documentElement;
	if (!html.classList.contains('gfm')) return;

	function addMenuButton() {
		if (!document.getElementById('sidebar') || document.getElementById('gfm-menu-button')) return;
		const button = document.createElement('button');
		button.id = 'gfm-menu-button';
		button.type = 'button';
		button.setAttribute('aria-label', 'Menu');
		button.setAttribute('aria-expanded', 'false');
		button.textContent = '☰';
		button.addEventListener('click', function () {
			const open = html.classList.toggle('gfm-menu-open');
			button.setAttribute('aria-expanded', String(open));
		});
		document.body.appendChild(button);

		// tapping the dimmed backdrop closes the drawer
		const backdrop = document.createElement('div');
		backdrop.id = 'gfm-menu-backdrop';
		backdrop.addEventListener('click', function () {
			html.classList.remove('gfm-menu-open');
			button.setAttribute('aria-expanded', 'false');
		});
		document.body.appendChild(backdrop);
	}

	function wrapTables(scope) {
		if (!html.classList.contains('gfm-fluid')) return;
		scope.querySelectorAll('#content table').forEach(function (table) {
			if (table.parentElement.classList.contains('gfm-scroll') || table.closest('.gfm-scroll')) return;
			const wrapper = document.createElement('div');
			wrapper.className = 'gfm-scroll';
			table.before(wrapper);
			wrapper.appendChild(table);
		});
	}

	function init() {
		addMenuButton();
		wrapTables(document);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init, { once: true });
	} else {
		init();
	}
})();
