# Security policy

Gladiatus for mobile runs on pages that hold your game session, so we keep its
attack surface minimal:

- no extension permissions, no background script, no network access
- no code loaded at runtime, no `eval`, no third-party libraries
- content scripts run in the extension's isolated world and never expose APIs to the page

## Reporting a problem

Please report a vulnerability privately through **GitHub → Security → Report a
vulnerability** on this repository. Do not open a public issue.

Never include your session hash (`sh=…` in game URLs), your csrf token, or saved
game pages in any report. Run `scripts/sanitize-fixture.mjs` on pages first.

## Supported versions

Only the latest release is supported.
