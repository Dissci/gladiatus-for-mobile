// Runs the add-on in Firefox for Android over USB (npm run android).
// web-ext needs --android-device even when only one phone is connected, so
// this picks the single ready device from `adb devices` and explains the
// usual setup problems. Extra arguments are passed on to web-ext:
//
//   npm run android
//   npm run android -- --android-device=<id>     several phones connected
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** `adb devices` output → [{ id, state }] */
export function parseDevices(out) {
	const lines = out.split(/\r?\n/);
	// a cold start prints "* daemon …" lines before the header
	return lines.slice(lines.findIndex((l) => l.startsWith('List of devices')) + 1)
		.map((line) => line.trim().split(/\s+/))
		.filter((parts) => parts.length >= 2 && parts[0])
		.map(([id, state]) => ({ id, state }));
}

/** @returns {{ id?: string, error?: string }} */
export function pickDevice(devices) {
	const ready = devices.filter((d) => d.state === 'device');
	if (ready.length === 1) return { id: ready[0].id };
	if (ready.length > 1) {
		return { error: `Several phones are connected (${ready.map((d) => d.id).join(', ')}). Choose one: npm run android -- --android-device=<id>` };
	}
	if (devices.some((d) => d.state === 'unauthorized')) {
		return { error: 'The phone has not allowed this computer yet. Unlock it, accept "Allow USB debugging?" (tick "Always allow from this computer"), then run this again. No prompt? Replug the cable, or revoke USB debugging authorizations in Developer options and replug.' };
	}
	if (devices.length) {
		return { error: `The phone is "${devices[0].state}". Replug the cable and check that USB debugging is on.` };
	}
	return { error: 'No phone found. Connect it by USB with USB debugging on (Developer options), and turn on "Remote debugging via USB" in Firefox settings.' };
}

// release first: org.mozilla.fenix is Nightly, not the Play Store Firefox
const FIREFOX_APKS = ['org.mozilla.firefox', 'org.mozilla.firefox_beta', 'org.mozilla.fenix'];

/** `adb shell pm list packages` output → the Firefox package to use, or null */
export function pickFirefox(out) {
	const installed = new Set(out.split(/\r?\n/).map((l) => l.trim().replace(/^package:/, '')));
	return FIREFOX_APKS.find((apk) => installed.has(apk)) || null;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const passthrough = process.argv.slice(2);
	if (!passthrough.some((a) => a.startsWith('--android-device'))) {
		let out;
		try {
			out = execFileSync('adb', ['devices'], { encoding: 'utf8' });
		} catch (e) {
			console.error('adb not found. Install the Android platform tools (winget install Google.PlatformTools) and open a new terminal.');
			process.exit(1);
		}
		const { id, error } = pickDevice(parseDevices(out));
		if (error) {
			console.error(error);
			process.exit(1);
		}
		passthrough.push(`--android-device=${id}`);
	}
	if (!passthrough.some((a) => a.startsWith('--firefox-apk'))) {
		const device = passthrough.find((a) => a.startsWith('--android-device')).split('=')[1];
		const apk = pickFirefox(execFileSync('adb', ['-s', device, 'shell', 'pm', 'list', 'packages', 'org.mozilla'], { encoding: 'utf8' }));
		if (!apk) {
			console.error('Firefox is not installed on the phone. Install it from the Play Store, then turn on "Remote debugging via USB" in its settings.');
			process.exit(1);
		}
		passthrough.push(`--firefox-apk=${apk}`);
	}
	const command = ['npx', '--yes', 'web-ext', 'run', '--source-dir', 'src',
		'--target=firefox-android', ...passthrough]
		.map((a) => (/^[\w.:=/@-]+$/.test(a) ? a : JSON.stringify(a))).join(' ');
	// a single command string: npx is a .cmd file on Windows and needs a shell
	const result = spawnSync(command, { stdio: 'inherit', shell: true });
	process.exit(result.status ?? 1);
}
