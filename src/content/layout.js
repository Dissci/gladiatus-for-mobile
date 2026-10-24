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

	// Links, not <button>/<div>: the game's touch handler (game.js, ANALYSIS §1.4)
	// treats a tap on anything that is not a link, form field or label as
	// "show tooltip" and cancels the click with preventDefault on touchend.
	function linkButton(id, label) {
		const link = document.createElement('a');
		link.id = id;
		link.href = '#';
		link.setAttribute('role', 'button');
		link.setAttribute('aria-label', label);
		return link;
	}

	function addMenuButton() {
		if (!document.getElementById('sidebar') || document.getElementById('gfm-menu-button')) return;
		const button = linkButton('gfm-menu-button', 'Menu');
		button.setAttribute('aria-expanded', 'false');
		button.textContent = '☰';

		function setOpen(open) {
			html.classList.toggle('gfm-menu-open', open);
			button.setAttribute('aria-expanded', String(open));
		}
		button.addEventListener('click', function (event) {
			event.preventDefault(); // no "#" in the URL
			setOpen(!html.classList.contains('gfm-menu-open'));
		});
		// a link activates on Enter; a button also on Space
		button.addEventListener('keydown', function (event) {
			if (event.key === ' ') {
				event.preventDefault();
				setOpen(!html.classList.contains('gfm-menu-open'));
			}
		});
		document.body.appendChild(button);

		// tapping the dimmed backdrop closes the drawer
		const backdrop = linkButton('gfm-menu-backdrop', 'Close menu');
		backdrop.tabIndex = -1;
		backdrop.addEventListener('click', function (event) {
			event.preventDefault();
			setOpen(false);
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
