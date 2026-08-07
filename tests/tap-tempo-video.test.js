"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  TapTempoTracker,
  TapVideoWidget,
  approachRate,
  median,
  tempoToRate
} = require("../assets/js/tap-tempo-video.js");

function createFakeWidget() {
  function createNode() {
    return {
      classList: { add() {}, remove() {} },
      disabled: false,
      hidden: false,
      listeners: {},
      muted: true,
      offsetWidth: 1,
      paused: false,
      playbackRate: 1,
      playCalls: 0,
      style: {},
      textContent: "",
      addEventListener(name, handler) { this.listeners[name] = handler; },
      pause() { this.paused = true; },
      play() { this.playCalls += 1; this.paused = false; return Promise.resolve(); }
    };
  }

  const nodes = {
    canvas: Object.assign(createNode(), { getContext() { return {}; } }),
    video: createNode(),
    tapSurface: createNode(),
    tapPulse: createNode(),
    tapPrompt: createNode(),
    bpm: createNode(),
    rate: createNode(),
    stageRate: createNode(),
    status: createNode(),
    meterFill: createNode(),
    meterMarker: createNode(),
    playToggle: createNode(),
    muteToggle: createNode(),
    reset: createNode()
  };
  nodes.video.paused = true;
  const selectors = {
    "[data-demo-canvas]": nodes.canvas,
    "[data-video]": nodes.video,
    "[data-tap-surface]": nodes.tapSurface,
    "[data-tap-pulse]": nodes.tapPulse,
    "[data-tap-prompt]": nodes.tapPrompt,
    "[data-bpm]": nodes.bpm,
    "[data-rate]": nodes.rate,
    "[data-stage-rate]": nodes.stageRate,
    "[data-status]": nodes.status,
    "[data-meter-fill]": nodes.meterFill,
    "[data-meter-marker]": nodes.meterMarker,
    "[data-play-toggle]": nodes.playToggle,
    "[data-mute-toggle]": nodes.muteToggle,
    "[data-reset]": nodes.reset
  };
  const element = {
    getAttribute() { return "120"; },
    querySelector(selector) { return selectors[selector]; }
  };

  return { widget: new TapVideoWidget(element), nodes };
}

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

test("sound starts on the second valid tap", () => {
  const originalAnimationFrame = global.requestAnimationFrame;
  global.requestAnimationFrame = () => 0;

  try {
    const { widget, nodes } = createFakeWidget();

    assert.equal(nodes.video.muted, false);
    assert.equal(nodes.video.paused, true);
    assert.equal(nodes.playToggle.disabled, true);

    widget.registerTap(0);
    assert.equal(nodes.video.playCalls, 0);

    widget.registerTap(500);
    assert.equal(nodes.video.playCalls, 1);
    assert.equal(nodes.video.paused, false);
    assert.equal(nodes.playToggle.disabled, false);
    assert.equal(Math.round(widget.activeBpm), 120);
  } finally {
    if (originalAnimationFrame === undefined) {
      delete global.requestAnimationFrame;
    } else {
      global.requestAnimationFrame = originalAnimationFrame;
    }
  }
});

test("established tempo survives inactivity and a movie loop seek", () => {
  const originalAnimationFrame = global.requestAnimationFrame;
  global.requestAnimationFrame = () => 0;

  try {
    const { widget, nodes } = createFakeWidget();

    widget.registerTap(0);
    widget.registerTap(600);
    widget.currentRate = widget.targetRate;
    widget.frame(4000);

    assert.equal(Math.round(widget.activeBpm), 100);
    assert.equal(widget.targetRate, 100 / 120);
    assert.equal(nodes.bpm.textContent, "100");

    nodes.video.playbackRate = 1;
    nodes.video.listeners.seeked();
    assert.equal(nodes.video.playbackRate, widget.currentRate);
  } finally {
    if (originalAnimationFrame === undefined) {
      delete global.requestAnimationFrame;
    } else {
      global.requestAnimationFrame = originalAnimationFrame;
    }
  }
});
