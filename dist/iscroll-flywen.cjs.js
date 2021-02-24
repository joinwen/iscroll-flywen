"use strict";

function hasPerspective() {
  return false;
}

function hasTransform() {
  return false;
}
function hasTransition() {
  return false;
}
const _elementStyle = document.createElement("div").style;
const _vendor = (function () {
  var vendors = ["t", "webkitT", "MozT", "msT", "OT"],
    transform,
    i = 0,
    l = vendors.length;

  for (; i < l; i++) {
    transform = vendors[i] + "ransform";
    if (transform in _elementStyle)
      return vendors[i].substr(0, vendors[i].length - 1);
  }

  return false;
})();

function _prefixStyle(style) {
  if (_vendor === false) return false;
  if (_vendor === "") return style;
  return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
}

const ease = {
  quadratic: {
    style: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    fn: function (k) {
      return k * (2 - k);
    },
  },
  circular: {
    style: "cubic-bezier(0.1, 0.57, 0.1, 1)", // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
    fn: function (k) {
      return Math.sqrt(1 - --k * k);
    },
  },
  back: {
    style: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    fn: function (k) {
      var b = 4;
      return (k = k - 1) * k * ((b + 1) * k + b) + 1;
    },
  },
  bounce: {
    style: "",
    fn: function (k) {
      if ((k /= 1) < 1 / 2.75) {
        return 7.5625 * k * k;
      } else if (k < 2 / 2.75) {
        return 7.5625 * (k -= 1.5 / 2.75) * k + 0.75;
      } else if (k < 2.5 / 2.75) {
        return 7.5625 * (k -= 2.25 / 2.75) * k + 0.9375;
      } else {
        return 7.5625 * (k -= 2.625 / 2.75) * k + 0.984375;
      }
    },
  },
  elastic: {
    style: "",
    fn: function (k) {
      var f = 0.22,
        e = 0.4;

      if (k === 0) {
        return 0;
      }
      if (k == 1) {
        return 1;
      }

      return (
        e * Math.pow(2, -10 * k) * Math.sin(((k - f / 4) * (2 * Math.PI)) / f) +
        1
      );
    },
  },
};

const transformStyle = {
  transform: _prefixStyle("transform"),
  transitionTimingFunction: _prefixStyle("transitionTimingFunction"),
  transitionDuration: _prefixStyle("transitionDuration"),
  transitionDelay: _prefixStyle("transitionDelay"),
  transformOrigin: _prefixStyle("transformOrigin"),
  touchAction: _prefixStyle("touchAction"),
};

const rAF =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };
const getTime = () => {
  return Date.now();
};

class Scroll {
  constructor(el, options) {
    this.wrapper = typeof el == "string" ? document.querySelector(el) : el;
    this.generateOptions(options);
  }
  generateOptions(options) {
    this.options = {};
    this.scroller = this.wrapper.children[0];
    this.scrollerStyle = this.scroller.style;
    for (let i in options) {
      this.options[i] = options[i];
    }
    this.translateZ =
      this.options.HWCompositing && hasPerspective ? "translateZ(0)" : "";
    this.options.useTransition = hasTransition && this.options.useTransition;
    this.options.useTransform = hasTransform && this.options.useTransform;

    this.options.bounceEasing =
      typeof this.options.bounceEasing == "string"
        ? ease[this.options.bounceEasing] || ease.circular
        : this.options.bounceEasing;

    this.options.resizePolling =
      this.options.resizePolling === undefined
        ? 60
        : this.options.resizePolling;
    this.options.tap && (this.options.tap = "tap");
    if (!this.options.useTransition && !this.options.useTransform) {
      this.scrollerStyle.position = "relative";
    }
    if (this.options.shrinkScrollbars == "scale") {
      this.options.useTransition = false;
    }
    this.x = 0;
    this.y = 0;
    this.directionX = 0;
    this.directionY = 0;
    this._events = {};
    this.init();
  }
  init() {
    this.scrollTo(this.options.startX, this.options.startY);
  }
  translate(x, y) {
    if (this.options.useTransform) {
      this.scrollerStyle[
        "transform"
      ] = `translate(${x}px,${y}px ${this.translateZ})`;
    } else {
      x = Math.round(x);
      y = Math.round(y);
      this.scrollerStyle.left = x + "px";
      this.scrollerStyle.top = y + "px";
    }
    this.x = x;
    this.y = y;
  }
  scrollTo(x, y, time, easing) {
    easing = easing || ease.circular;
    this.isIntransition = this.options.useTransition && time > 0;
    let transitionType = this.options.useTransition && easing.style;
    if (!time || transitionType) {
      if (transitionType) {
        this.transitionTimingFunction(easing.style);
        this.transitionTime(time);
      }
      this.translate(x, y);
    } else {
      this.animate(x, y, time, easing.fn);
    }
  }
  animate(destX, destY, duration, easingFn) {
    var that = this,
      startX = this.x,
      startY = this.y,
      startTime = getTime(),
      destTime = startTime + duration;

    function step() {
      var now = getTime(),
        newX,
        newY,
        easing;

      if (now >= destTime) {
        that.isAnimating = false;
        that.translate(destX, destY);

        if (!that.resetPosition(that.options.bounceTime)) {
          that._execEvent("scrollEnd");
        }

        return;
      }

      now = (now - startTime) / duration;
      easing = easingFn(now);
      newX = (destX - startX) * easing + startX;
      newY = (destY - startY) * easing + startY;
      that._translate(newX, newY);

      if (that.isAnimating) {
        rAF(step);
      }
    }

    this.isAnimating = true;
    step();
  }
  transitionTimingFunction(easing) {
    this.scrollerStyle[transformStyle.transitionTimingFunction] = easing;

    if (this.indicators) {
      for (var i = this.indicators.length; i--; ) {
        this.indicators[i].transitionTimingFunction(easing);
      }
    }
  }
  transitionTime(time) {
    time = time || 0;
    var durationProp = transformStyle.transitionDuration;
    if (!durationProp) {
      return;
    }

    this.indicatorStyle[durationProp] = time + "ms";
  }
}

module.exports = Scroll;
