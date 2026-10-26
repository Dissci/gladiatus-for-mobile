// Pixel comparison of two screenshots (scripts/screenshots.mjs).
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/** A copy of `png` on a `width` × `height` canvas, the rest transparent. */
function padded(png, width, height) {
	if (png.width === width && png.height === height) return png;
	const out = new PNG({ width, height });
	PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
	return out;
}

/**
 * @param {Buffer} before PNG
 * @param {Buffer} after PNG
 * @returns {{ pixels: number, sizeChanged: boolean, diff: Buffer | null }}
 *   pixels that differ (anti-aliasing ignored); diff is a PNG with the
 *   differences in red over a faded `before`, or null when nothing differs
 */
export function comparePng(before, after) {
	const a = PNG.sync.read(before);
	const b = PNG.sync.read(after);
	const width = Math.max(a.width, b.width);
	const height = Math.max(a.height, b.height);
	const diff = new PNG({ width, height });
	const pixels = pixelmatch(padded(a, width, height).data, padded(b, width, height).data, diff.data, width, height, { threshold: 0.1 });
	const sizeChanged = a.width !== b.width || a.height !== b.height;
	return { pixels, sizeChanged, diff: pixels || sizeChanged ? PNG.sync.write(diff) : null };
}
