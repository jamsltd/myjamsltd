(function (root, factory) {
  var api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.TapTempoVideo = api;
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", api.init);
    } else {
      api.init();
    }
  }
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function median(values) {
    if (!values.length) {
      return null;
    }

    var ordered = values.slice().sort(function (a, b) { return a - b; });
    var middle = Math.floor(ordered.length / 2);

    if (ordered.length % 2) {
      return ordered[middle];
    }

    return (ordered[middle - 1] + ordered[middle]) / 2;
  }

  function tempoToRate(bpm, referenceBpm, minimum, maximum) {
    if (!Number.isFinite(bpm) || bpm <= 0) {
      return 1;
    }

    return clamp(bpm / referenceBpm, minimum, maximum);
  }

  function approachRate(current, target, elapsedMs, smoothingMs) {
    if (elapsedMs <= 0) {
      return current;
    }

    var proportion = 1 - Math.exp(-elapsedMs / smoothingMs);
    return current + ((target - current) * proportion);
  }

  function TapTempoTracker(options) {
    options = options || {};
    this.minimumInterval = options.minimumInterval || 120;
    this.maximumInterval = options.maximumInterval || 1600;
    this.staleAfter = options.staleAfter || 2200;
    this.maximumSamples = options.maximumSamples || 4;
    this.intervals = [];
    this.lastTap = null;
  }

  TapTempoTracker.prototype.clear = function () {
    this.intervals = [];
    this.lastTap = null;
  };

  TapTempoTracker.prototype.isStale = function (timestamp) {
    return this.lastTap !== null && timestamp - this.lastTap > this.staleAfter;
  };

  TapTempoTracker.prototype.tap = function (timestamp) {
    if (!Number.isFinite(timestamp)) {
      throw new TypeError("Tap timestamp must be a finite number.");
    }

    if (this.lastTap === null || this.isStale(timestamp)) {
      this.intervals = [];
      this.lastTap = timestamp;
      return { bpm: null, count: 1, ignored: false };
    }

    var interval = timestamp - this.lastTap;

    if (interval < this.minimumInterval) {
      return {
        bpm: this.intervals.length ? 60000 / median(this.intervals) : null,
        count: this.intervals.length + 1,
        ignored: true
      };
    }

    this.lastTap = timestamp;

    if (interval > this.maximumInterval) {
      this.intervals = [];
      return { bpm: null, count: 1, ignored: false };
    }

    this.intervals.push(interval);

    if (this.intervals.length > this.maximumSamples) {
      this.intervals.shift();
    }

    return {
      bpm: 60000 / median(this.intervals),
      count: this.intervals.length + 1,
      ignored: false
    };
  };

  function TapVideoWidget(element) {
    this.element = element;
    this.referenceBpm = Number(element.getAttribute("data-reference-bpm")) || 120;
    this.minimumRate = 0.5;
    this.maximumRate = 2;
    this.tracker = new TapTempoTracker();
    this.activeBpm = null;
    this.targetRate = 1;
    this.currentRate = 1;
    this.lastFrame = null;
    this.demoTime = 0;
    this.demoPlaying = false;
    this.demoActive = false;
    this.hasStarted = false;
    this.wasStale = false;
    this.boundFrame = this.frame.bind(this);

    this.canvas = element.querySelector("[data-demo-canvas]");
    this.context = this.canvas.getContext("2d");
    this.video = element.querySelector("[data-video]");
    this.tapSurface = element.querySelector("[data-tap-surface]");
    this.tapPulse = element.querySelector("[data-tap-pulse]");
    this.tapPrompt = element.querySelector("[data-tap-prompt]");
    this.bpmOutput = element.querySelector("[data-bpm]");
    this.rateOutput = element.querySelector("[data-rate]");
    this.stageRate = element.querySelector("[data-stage-rate]");
    this.statusOutput = element.querySelector("[data-status]");
    this.meterFill = element.querySelector("[data-meter-fill]");
    this.meterMarker = element.querySelector("[data-meter-marker]");
    this.playToggle = element.querySelector("[data-play-toggle]");
    this.muteToggle = element.querySelector("[data-mute-toggle]");
    this.resetButton = element.querySelector("[data-reset]");

    this.playToggle.disabled = true;
    this.bindEvents();
    this.video.preservesPitch = true;
    this.video.muted = false;
    this.video.playbackRate = this.currentRate;
    this.updateRateDisplay();
    requestAnimationFrame(this.boundFrame);
  }

  TapVideoWidget.prototype.bindEvents = function () {
    var widget = this;

    this.tapSurface.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse" || event.button === 0) {
        event.preventDefault();
        widget.registerTap(performance.now());
      }
    });

    this.tapSurface.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        widget.registerTap(performance.now());
      }
    });

    this.playToggle.addEventListener("click", function () {
      widget.togglePlayback();
    });

    this.resetButton.addEventListener("click", function () {
      widget.resetTempo();
    });

    this.muteToggle.addEventListener("click", function () {
      widget.toggleMute();
    });

    this.video.addEventListener("play", function () {
      widget.playToggle.textContent = "Pause";
    });

    this.video.addEventListener("pause", function () {
      if (!widget.demoActive) {
        widget.playToggle.textContent = "Play";
      }
    });

    this.video.addEventListener("seeked", function () {
      widget.video.playbackRate = widget.currentRate;
    });

    this.video.addEventListener("error", function () {
      widget.activateFallback();
    });
  };

  TapVideoWidget.prototype.registerTap = function (timestamp) {
    var result = this.tracker.tap(timestamp);
    this.wasStale = false;
    this.pulse();

    if (result.ignored) {
      this.setStatus("Tap more distinctly");
      return;
    }

    this.tapPrompt.classList.add("is-quiet");

    if (result.bpm === null) {
      if (this.activeBpm === null) {
        this.bpmOutput.textContent = "—";
        this.setStatus("One more tap");
      } else {
        this.bpmOutput.textContent = String(Math.round(this.activeBpm));
        this.setStatus("One more tap to change tempo");
      }
    } else {
      this.activeBpm = result.bpm;
      this.bpmOutput.textContent = String(Math.round(result.bpm));
      this.targetRate = tempoToRate(
        result.bpm,
        this.referenceBpm,
        this.minimumRate,
        this.maximumRate
      );
      this.setStatus("Following your tempo");
      this.hasStarted = true;
      this.playToggle.disabled = false;

      if (this.demoActive) {
        this.demoPlaying = true;
        this.playToggle.textContent = "Pause";
      } else if (this.video.paused) {
        var playPromise = this.video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      }
    }
  };

  TapVideoWidget.prototype.pulse = function () {
    this.tapPulse.classList.remove("is-active");
    void this.tapPulse.offsetWidth;
    this.tapPulse.classList.add("is-active");
  };

  TapVideoWidget.prototype.setStatus = function (message) {
    this.statusOutput.textContent = message;
  };

  TapVideoWidget.prototype.resetTempo = function () {
    this.tracker.clear();
    this.activeBpm = null;
    this.targetRate = 1;
    this.wasStale = false;
    this.bpmOutput.textContent = "—";
    this.tapPrompt.classList.remove("is-quiet");
    this.setStatus("Ready to tap");
  };

  TapVideoWidget.prototype.togglePlayback = function () {
    if (!this.hasStarted) {
      this.setStatus("Tap twice to start");
      return;
    }

    if (this.demoActive) {
      this.demoPlaying = !this.demoPlaying;
      this.playToggle.textContent = this.demoPlaying ? "Pause" : "Play";
      this.setStatus(this.demoPlaying ? "Motion resumed" : "Motion paused");
      return;
    }

    if (this.video.paused) {
      this.video.play();
    } else {
      this.video.pause();
    }
  };

  TapVideoWidget.prototype.toggleMute = function () {
    this.video.muted = !this.video.muted;
    this.muteToggle.textContent = this.video.muted ? "Sound on" : "Sound off";
  };

  TapVideoWidget.prototype.activateFallback = function () {
    this.video.pause();
    this.demoActive = true;
    this.demoPlaying = this.hasStarted;
    this.canvas.hidden = false;
    this.video.hidden = true;
    this.muteToggle.hidden = true;
    this.playToggle.textContent = this.demoPlaying ? "Pause" : "Play";
    this.setStatus(this.demoPlaying ?
      "Video unavailable — motion demo active" :
      "Video unavailable — tap twice to start motion demo");
  };

  TapVideoWidget.prototype.updateRateDisplay = function () {
    var formatted = this.currentRate.toFixed(2);
    var percentage = ((this.currentRate - this.minimumRate) /
      (this.maximumRate - this.minimumRate)) * 100;

    this.rateOutput.textContent = formatted;
    this.stageRate.textContent = formatted + "×";
    this.meterFill.style.width = percentage + "%";
    this.meterMarker.style.left = percentage + "%";

    if (!this.demoActive && Math.abs(this.video.playbackRate - this.currentRate) > 0.005) {
      this.video.playbackRate = this.currentRate;
    }
  };

  TapVideoWidget.prototype.resizeCanvas = function () {
    var width = this.canvas.clientWidth;
    var height = this.canvas.clientHeight;
    var scale = Math.min(window.devicePixelRatio || 1, 2);

    if (this.canvas.width !== Math.round(width * scale) ||
        this.canvas.height !== Math.round(height * scale)) {
      this.canvas.width = Math.round(width * scale);
      this.canvas.height = Math.round(height * scale);
      this.context.setTransform(scale, 0, 0, scale, 0, 0);
    }

    return { width: width, height: height };
  };

  TapVideoWidget.prototype.drawDemo = function () {
    var dimensions = this.resizeCanvas();
    var context = this.context;
    var width = dimensions.width;
    var height = dimensions.height;
    var time = this.demoTime;
    var horizon = height * 0.7;

    context.clearRect(0, 0, width, height);

    var gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#15232b");
    gradient.addColorStop(0.55, "#1c3238");
    gradient.addColorStop(1, "#0d151b");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 0.15;
    context.strokeStyle = "#90f1ef";
    context.lineWidth = 1;
    var gridOffset = (time * 90) % 54;
    for (var x = -54 + gridOffset; x < width + 54; x += 54) {
      context.beginPath();
      context.moveTo(width / 2 + (x - width / 2) * 0.18, horizon);
      context.lineTo(x, height);
      context.stroke();
    }
    for (var y = 0; y < 7; y += 1) {
      var ratio = y / 7;
      var gridY = horizon + (ratio * ratio * (height - horizon));
      context.beginPath();
      context.moveTo(0, gridY);
      context.lineTo(width, gridY);
      context.stroke();
    }
    context.restore();

    var centreX = width * 0.5;
    var centreY = height * 0.47;
    var orbit = Math.min(width, height) * 0.25;
    var angle = time * 1.6;

    context.save();
    context.translate(centreX, centreY);
    context.rotate(angle * 0.18);
    context.strokeStyle = "rgba(87, 203, 204, 0.38)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(0, 0, orbit, orbit * 0.42, 0, 0, Math.PI * 2);
    context.stroke();

    for (var index = 0; index < 4; index += 1) {
      var pointAngle = angle + (index * Math.PI / 2);
      var pointX = Math.cos(pointAngle) * orbit;
      var pointY = Math.sin(pointAngle) * orbit * 0.42;
      var radius = index === 0 ? 17 : 9;
      context.beginPath();
      context.fillStyle = index === 0 ? "#ffac75" : "#57cbcc";
      context.shadowColor = context.fillStyle;
      context.shadowBlur = index === 0 ? 22 : 12;
      context.arc(pointX, pointY, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.restore();

    context.save();
    context.translate(centreX, centreY);
    context.rotate(-angle * 0.42);
    context.strokeStyle = "rgba(255, 255, 255, 0.18)";
    context.lineWidth = 7;
    context.beginPath();
    context.arc(0, 0, orbit * 0.38, 0.18, Math.PI * 1.55);
    context.stroke();
    context.restore();
  };

  TapVideoWidget.prototype.frame = function (timestamp) {
    if (this.lastFrame === null) {
      this.lastFrame = timestamp;
    }

    var elapsed = Math.min(timestamp - this.lastFrame, 100);
    this.lastFrame = timestamp;

    if (this.activeBpm !== null && this.tracker.isStale(timestamp)) {
      this.activeBpm = null;
      this.targetRate = 1;
      if (!this.wasStale) {
        this.wasStale = true;
        this.bpmOutput.textContent = "—";
        this.setStatus("Returning to normal");
      }
    }

    this.currentRate = approachRate(this.currentRate, this.targetRate, elapsed, 280);

    if (Math.abs(this.currentRate - this.targetRate) < 0.002) {
      this.currentRate = this.targetRate;
      if (this.wasStale && this.currentRate === 1) {
        this.setStatus("Ready to tap");
        this.tapPrompt.classList.remove("is-quiet");
      }
    }

    if (this.demoActive && this.demoPlaying) {
      this.demoTime += (elapsed / 1000) * this.currentRate;
    }

    if (this.demoActive) {
      this.drawDemo();
    }

    this.updateRateDisplay();
    requestAnimationFrame(this.boundFrame);
  };

  function init() {
    var widgets = document.querySelectorAll("[data-tap-video-widget]");
    Array.prototype.forEach.call(widgets, function (widget) {
      if (!widget.tapVideoController) {
        widget.tapVideoController = new TapVideoWidget(widget);
      }
    });
  }

  return {
    TapTempoTracker: TapTempoTracker,
    TapVideoWidget: TapVideoWidget,
    approachRate: approachRate,
    clamp: clamp,
    init: init,
    median: median,
    tempoToRate: tempoToRate
  };
});
