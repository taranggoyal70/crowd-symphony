import assert from "node:assert/strict";
import { test } from "node:test";

import { handHeightToVolume, smoothVolume } from "../lib/audio-mapping";

test("hand at top of frame is full volume, bottom is silence", () => {
	assert.equal(handHeightToVolume(0), 100);
	assert.equal(handHeightToVolume(1), 0);
	assert.equal(handHeightToVolume(0.5), 50);
});

test("out-of-frame landmarks stay clamped to [0,100]", () => {
	assert.equal(handHeightToVolume(-0.2), 100);
	assert.equal(handHeightToVolume(1.5), 0);
});

test("smoothing eases toward the target and clamps", () => {
	assert.equal(smoothVolume(50, 100), 65); // 50 + (50 * 0.3)
	assert.equal(smoothVolume(0, 200), 60); // target clamps via rounding path
	assert.ok(smoothVolume(100, -500) >= 0);
	assert.ok(smoothVolume(0, 500) <= 100);
});
