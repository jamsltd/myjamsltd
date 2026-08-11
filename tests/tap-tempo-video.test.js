"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  TapTempoTracker,
  approachRate,
  median,
  syncPlaybackRate,
  tempoToRate
} = require("../assets/js/tap-tempo-video.js");

test("median is stable against a single irregular tap", () => {
  assert.equal(median([500, 500, 900, 500]), 500);
});

test("tap intervals produce a rolling median tempo", () => {
  const tracker = new TapTempoTracker();

  assert.equal(tracker.tap(0).bpm, null);
  assert.equal(tracker.tap(500).bpm, 120);
  assert.equal(tracker.tap(1000).bpm, 120);
  assert.equal(tracker.tap(1500).bpm, 120);
});

test("implausibly close duplicate taps are ignored", () => {
  const tracker = new TapTempoTracker();

  tracker.tap(0);
  const duplicate = tracker.tap(80);
  const valid = tracker.tap(500);

  assert.equal(duplicate.ignored, true);
  assert.equal(Math.round(valid.bpm), 120);
});

test("a stale sequence starts afresh", () => {
  const tracker = new TapTempoTracker({ staleAfter: 2000 });

  tracker.tap(0);
  tracker.tap(500);
  const restarted = tracker.tap(3000);

  assert.equal(restarted.bpm, null);
  assert.equal(restarted.count, 1);
});

test("tempo maps to playback rate and respects limits", () => {
  assert.equal(tempoToRate(60, 120, 0.5, 2), 0.5);
  assert.equal(tempoToRate(120, 120, 0.5, 2), 1);
  assert.equal(tempoToRate(180, 120, 0.5, 2), 1.5);
  assert.equal(tempoToRate(360, 120, 0.5, 2), 2);
  assert.equal(tempoToRate(30, 120, 0.5, 2), 0.5);
});

test("rate smoothing approaches the target without overshooting", () => {
  const first = approachRate(1, 2, 100, 280);
  const second = approachRate(first, 2, 100, 280);

  assert.ok(first > 1 && first < 2);
  assert.ok(second > first && second < 2);
});

test("returning to normal at ten-times smoothing drifts more slowly", () => {
  const regular = approachRate(1.5, 1, 100, 280);
  const slowReturn = approachRate(1.5, 1, 100, 2800);

  assert.ok(slowReturn > regular);
  assert.ok(slowReturn < 1.5);
});

test("video restarts at the current eased playback rate", () => {
  const video = { defaultPlaybackRate: 1, playbackRate: 1 };

  syncPlaybackRate(video, 1.35);

  assert.equal(video.defaultPlaybackRate, 1.35);
  assert.equal(video.playbackRate, 1.35);
});
