// npm run android picks the phone from `adb devices` (scripts/android.mjs).
const test = require('node:test');
const assert = require('node:assert/strict');

const android = () => import('../scripts/android.mjs');

test('adb output is parsed', async () => {
	const { parseDevices } = await android();
	const out = '* daemon started successfully\r\nList of devices attached\r\n97ffc4fa\tunauthorized\r\nemulator-5554\tdevice\r\n\r\n';
	assert.deepEqual(parseDevices(out), [
		{ id: '97ffc4fa', state: 'unauthorized' },
		{ id: 'emulator-5554', state: 'device' },
	]);
	assert.deepEqual(parseDevices('List of devices attached\n\n'), []);
});

test('one ready phone is picked', async () => {
	const { pickDevice } = await android();
	assert.deepEqual(pickDevice([{ id: 'a', state: 'device' }, { id: 'b', state: 'unauthorized' }]), { id: 'a' });
});

test('the Play Store Firefox is preferred over Beta and Nightly', async () => {
	const { pickFirefox } = await android();
	assert.equal(pickFirefox('package:org.mozilla.fenix\r\npackage:org.mozilla.firefox\r\n'), 'org.mozilla.firefox');
	assert.equal(pickFirefox('package:org.mozilla.fenix\n'), 'org.mozilla.fenix');
	assert.equal(pickFirefox('package:org.mozilla.focus\n'), null);
});

test('setup problems get an explanation instead of a device', async () => {
	const { pickDevice } = await android();
	assert.match(pickDevice([{ id: 'a', state: 'unauthorized' }]).error, /Allow USB debugging/);
	assert.match(pickDevice([]).error, /No phone found/);
	assert.match(pickDevice([{ id: 'a', state: 'device' }, { id: 'b', state: 'device' }]).error, /--android-device=<id>/);
	assert.match(pickDevice([{ id: 'a', state: 'offline' }]).error, /offline/);
});
