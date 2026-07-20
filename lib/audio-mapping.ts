/**
 * Hand-gesture → volume mapping for the conductor.
 *
 * Hand landmarks can fall slightly outside the [0,1] frame, which previously
 * let volume drift past 0/100. Both helpers clamp to the [0,100] rails.
 */

const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** avgY: normalized hand height (0 = top of frame, 1 = bottom). */
export function handHeightToVolume(avgY: number): number {
	return clamp(Math.round((1 - avgY) * 100));
}

/** Exponential smoothing toward a target volume (default 0.3 easing). */
export function smoothVolume(
	previous: number,
	target: number,
	factor = 0.3,
): number {
	return clamp(Math.round(previous + (target - previous) * factor));
}
