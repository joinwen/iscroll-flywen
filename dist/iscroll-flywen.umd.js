(function (global, factory) {
  typeof exports === "object" && typeof module !== "undefined"
    ? (module.exports = factory())
    : typeof define === "function" && define.amd
    ? define(factory)
    : ((global =
        typeof globalThis !== "undefined" ? globalThis : global || self),
      (global.iscrollFlywen = factory()));
})(this, function () {
  "use strict";

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function hasPerspective() {
    return false;
  }

  function hasTransform() {
    return false;
  }

  function hasTransition() {
    return false;
  }

  var _elementStyle = document.createElement("div").style;

  var _vendor = (function () {
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

  var ease = {
    quadratic: {
      style: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      fn: function fn(k) {
        return k * (2 - k);
      },
    },
    circular: {
      style: "cubic-bezier(0.1, 0.57, 0.1, 1)",
      // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
      fn: function fn(k) {
        return Math.sqrt(1 - --k * k);
      },
    },
    back: {
      style: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      fn: function fn(k) {
        var b = 4;
        return (k = k - 1) * k * ((b + 1) * k + b) + 1;
      },
    },
    bounce: {
      style: "",
      fn: function fn(k) {
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
      fn: function fn(k) {
        var f = 0.22,
          e = 0.4;

        if (k === 0) {
          return 0;
        }

        if (k == 1) {
          return 1;
        }

        return (
          e *
            Math.pow(2, -10 * k) *
            Math.sin(((k - f / 4) * (2 * Math.PI)) / f) +
          1
        );
      },
    },
  };
  var transformStyle = {
    transform: _prefixStyle("transform"),
    transitionTimingFunction: _prefixStyle("transitionTimingFunction"),
    transitionDuration: _prefixStyle("transitionDuration"),
    transitionDelay: _prefixStyle("transitionDelay"),
    transformOrigin: _prefixStyle("transformOrigin"),
    touchAction: _prefixStyle("touchAction"),
  };

  var rAF =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };

  var getTime = function getTime() {
    return Date.now();
  };

  var Scroll = /*#__PURE__*/ (function () {
    function Scroll(el, options) {
      _classCallCheck(this, Scroll);

      this.wrapper = typeof el == "string" ? document.querySelector(el) : el;
      this.generateOptions(options);
    }

    _createClass(Scroll, [
      {
        key: "generateOptions",
        value: function generateOptions(options) {
          this.options = {};
          this.scroller = this.wrapper.children[0];
          this.scrollerStyle = this.scroller.style;

          for (var i in options) {
            this.options[i] = options[i];
          }

          this.translateZ =
            this.options.HWCompositing && hasPerspective ? "translateZ(0)" : "";
          this.options.useTransition =
            hasTransition && this.options.useTransition;
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
        },
      },
      {
        key: "init",
        value: function init() {
          this.scrollTo(this.options.startX, this.options.startY);
        },
      },
      {
        key: "translate",
        value: function translate(x, y) {
          if (this.options.useTransform) {
            this.scrollerStyle["transform"] = "translate("
              .concat(x, "px,")
              .concat(y, "px ")
              .concat(this.translateZ, ")");
          } else {
            x = Math.round(x);
            y = Math.round(y);
            this.scrollerStyle.left = x + "px";
            this.scrollerStyle.top = y + "px";
          }

          this.x = x;
          this.y = y;
        },
      },
      {
        key: "scrollTo",
        value: function scrollTo(x, y, time, easing) {
          easing = easing || ease.circular;
          this.isIntransition = this.options.useTransition && time > 0;
          var transitionType = this.options.useTransition && easing.style;

          if (!time || transitionType) {
            if (transitionType) {
              this.transitionTimingFunction(easing.style);
              this.transitionTime(time);
            }

            this.translate(x, y);
          } else {
            this.animate(x, y, time, easing.fn);
          }
        },
      },
      {
        key: "animate",
        value: function animate(destX, destY, duration, easingFn) {
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
        },
      },
      {
        key: "transitionTimingFunction",
        value: function transitionTimingFunction(easing) {
          this.scrollerStyle[transformStyle.transitionTimingFunction] = easing;

          if (this.indicators) {
            for (var i = this.indicators.length; i--; ) {
              this.indicators[i].transitionTimingFunction(easing);
            }
          }
        },
      },
      {
        key: "transitionTime",
        value: function transitionTime(time) {
          time = time || 0;
          var durationProp = transformStyle.transitionDuration;

          if (!durationProp) {
            return;
          }

          this.indicatorStyle[durationProp] = time + "ms";
        },
      },
    ]);

    return Scroll;
  })();

  return Scroll;
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNjcm9sbC1mbHl3ZW4udW1kLmpzIiwic291cmNlcyI6WyIuLi9zcmMvdXRpbHMvaW5kZXguanMiLCIuLi9zcmMvc2Nyb2xsL2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImZ1bmN0aW9uIGhhc1BlcnNwZWN0aXZlKCkge1xyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaGFzVHJhbnNmb3JtKCkge1xyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5mdW5jdGlvbiBoYXNUcmFuc2l0aW9uKCkge1xyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5jb25zdCBfZWxlbWVudFN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKS5zdHlsZTtcclxuY29uc3QgX3ZlbmRvciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgdmFyIHZlbmRvcnMgPSBbXCJ0XCIsIFwid2Via2l0VFwiLCBcIk1velRcIiwgXCJtc1RcIiwgXCJPVFwiXSxcclxuICAgIHRyYW5zZm9ybSxcclxuICAgIGkgPSAwLFxyXG4gICAgbCA9IHZlbmRvcnMubGVuZ3RoO1xyXG5cclxuICBmb3IgKDsgaSA8IGw7IGkrKykge1xyXG4gICAgdHJhbnNmb3JtID0gdmVuZG9yc1tpXSArIFwicmFuc2Zvcm1cIjtcclxuICAgIGlmICh0cmFuc2Zvcm0gaW4gX2VsZW1lbnRTdHlsZSlcclxuICAgICAgcmV0dXJuIHZlbmRvcnNbaV0uc3Vic3RyKDAsIHZlbmRvcnNbaV0ubGVuZ3RoIC0gMSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gZmFsc2U7XHJcbn0pKCk7XHJcblxyXG5mdW5jdGlvbiBfcHJlZml4U3R5bGUoc3R5bGUpIHtcclxuICBpZiAoX3ZlbmRvciA9PT0gZmFsc2UpIHJldHVybiBmYWxzZTtcclxuICBpZiAoX3ZlbmRvciA9PT0gXCJcIikgcmV0dXJuIHN0eWxlO1xyXG4gIHJldHVybiBfdmVuZG9yICsgc3R5bGUuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBzdHlsZS5zdWJzdHIoMSk7XHJcbn1cclxuXHJcbmNvbnN0IGVhc2UgPSB7XHJcbiAgcXVhZHJhdGljOiB7XHJcbiAgICBzdHlsZTogXCJjdWJpYy1iZXppZXIoMC4yNSwgMC40NiwgMC40NSwgMC45NClcIixcclxuICAgIGZuOiBmdW5jdGlvbiAoaykge1xyXG4gICAgICByZXR1cm4gayAqICgyIC0gayk7XHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgY2lyY3VsYXI6IHtcclxuICAgIHN0eWxlOiBcImN1YmljLWJlemllcigwLjEsIDAuNTcsIDAuMSwgMSlcIiwgLy8gTm90IHByb3Blcmx5IFwiY2lyY3VsYXJcIiBidXQgdGhpcyBsb29rcyBiZXR0ZXIsIGl0IHNob3VsZCBiZSAoMC4wNzUsIDAuODIsIDAuMTY1LCAxKVxyXG4gICAgZm46IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIHJldHVybiBNYXRoLnNxcnQoMSAtIC0tayAqIGspO1xyXG4gICAgfSxcclxuICB9LFxyXG4gIGJhY2s6IHtcclxuICAgIHN0eWxlOiBcImN1YmljLWJlemllcigwLjE3NSwgMC44ODUsIDAuMzIsIDEuMjc1KVwiLFxyXG4gICAgZm46IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIHZhciBiID0gNDtcclxuICAgICAgcmV0dXJuIChrID0gayAtIDEpICogayAqICgoYiArIDEpICogayArIGIpICsgMTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBib3VuY2U6IHtcclxuICAgIHN0eWxlOiBcIlwiLFxyXG4gICAgZm46IGZ1bmN0aW9uIChrKSB7XHJcbiAgICAgIGlmICgoayAvPSAxKSA8IDEgLyAyLjc1KSB7XHJcbiAgICAgICAgcmV0dXJuIDcuNTYyNSAqIGsgKiBrO1xyXG4gICAgICB9IGVsc2UgaWYgKGsgPCAyIC8gMi43NSkge1xyXG4gICAgICAgIHJldHVybiA3LjU2MjUgKiAoayAtPSAxLjUgLyAyLjc1KSAqIGsgKyAwLjc1O1xyXG4gICAgICB9IGVsc2UgaWYgKGsgPCAyLjUgLyAyLjc1KSB7XHJcbiAgICAgICAgcmV0dXJuIDcuNTYyNSAqIChrIC09IDIuMjUgLyAyLjc1KSAqIGsgKyAwLjkzNzU7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIDcuNTYyNSAqIChrIC09IDIuNjI1IC8gMi43NSkgKiBrICsgMC45ODQzNzU7XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgfSxcclxuICBlbGFzdGljOiB7XHJcbiAgICBzdHlsZTogXCJcIixcclxuICAgIGZuOiBmdW5jdGlvbiAoaykge1xyXG4gICAgICB2YXIgZiA9IDAuMjIsXHJcbiAgICAgICAgZSA9IDAuNDtcclxuXHJcbiAgICAgIGlmIChrID09PSAwKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKGsgPT0gMSkge1xyXG4gICAgICAgIHJldHVybiAxO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKFxyXG4gICAgICAgIGUgKiBNYXRoLnBvdygyLCAtMTAgKiBrKSAqIE1hdGguc2luKCgoayAtIGYgLyA0KSAqICgyICogTWF0aC5QSSkpIC8gZikgK1xyXG4gICAgICAgIDFcclxuICAgICAgKTtcclxuICAgIH0sXHJcbiAgfSxcclxufTtcclxuXHJcbmNvbnN0IHRyYW5zZm9ybVN0eWxlID0ge1xyXG4gIHRyYW5zZm9ybTogX3ByZWZpeFN0eWxlKFwidHJhbnNmb3JtXCIpLFxyXG4gIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbjogX3ByZWZpeFN0eWxlKFwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uXCIpLFxyXG4gIHRyYW5zaXRpb25EdXJhdGlvbjogX3ByZWZpeFN0eWxlKFwidHJhbnNpdGlvbkR1cmF0aW9uXCIpLFxyXG4gIHRyYW5zaXRpb25EZWxheTogX3ByZWZpeFN0eWxlKFwidHJhbnNpdGlvbkRlbGF5XCIpLFxyXG4gIHRyYW5zZm9ybU9yaWdpbjogX3ByZWZpeFN0eWxlKFwidHJhbnNmb3JtT3JpZ2luXCIpLFxyXG4gIHRvdWNoQWN0aW9uOiBfcHJlZml4U3R5bGUoXCJ0b3VjaEFjdGlvblwiKSxcclxufTtcclxuXHJcbmNvbnN0IHJBRiA9XHJcbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG4gIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XHJcbiAgd2luZG93Lm9SZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICB3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcclxuICBmdW5jdGlvbiAoY2FsbGJhY2spIHtcclxuICAgIHdpbmRvdy5zZXRUaW1lb3V0KGNhbGxiYWNrLCAxMDAwIC8gNjApO1xyXG4gIH07XHJcbmNvbnN0IGdldFRpbWUgPSAoKSA9PiB7XHJcbiAgcmV0dXJuIERhdGUubm93KCk7XHJcbn07XHJcbmV4cG9ydCB7XHJcbiAgaGFzUGVyc3BlY3RpdmUsXHJcbiAgaGFzVHJhbnNmb3JtLFxyXG4gIGhhc1RyYW5zaXRpb24sXHJcbiAgZWFzZSxcclxuICB0cmFuc2Zvcm1TdHlsZSxcclxuICByQUYsXHJcbiAgZ2V0VGltZSxcclxufTtcclxuIiwiaW1wb3J0IHtcclxuICBoYXNQZXJzcGVjdGl2ZSxcclxuICBoYXNUcmFuc2Zvcm0sXHJcbiAgaGFzVHJhbnNpdGlvbixcclxuICBlYXNlLFxyXG4gIHRyYW5zZm9ybVN0eWxlLFxyXG4gIHJBRixcclxuICBnZXRUaW1lLFxyXG59IGZyb20gXCIuLi91dGlscy9pbmRleFwiO1xyXG5cclxuY2xhc3MgU2Nyb2xsIHtcclxuICBjb25zdHJ1Y3RvcihlbCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy53cmFwcGVyID0gdHlwZW9mIGVsID09IFwic3RyaW5nXCIgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGVsKSA6IGVsO1xyXG4gICAgdGhpcy5nZW5lcmF0ZU9wdGlvbnMob3B0aW9ucyk7XHJcbiAgfVxyXG4gIGdlbmVyYXRlT3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSB7fTtcclxuICAgIHRoaXMuc2Nyb2xsZXIgPSB0aGlzLndyYXBwZXIuY2hpbGRyZW5bMF07XHJcbiAgICB0aGlzLnNjcm9sbGVyU3R5bGUgPSB0aGlzLnNjcm9sbGVyLnN0eWxlO1xyXG4gICAgZm9yIChsZXQgaSBpbiBvcHRpb25zKSB7XHJcbiAgICAgIHRoaXMub3B0aW9uc1tpXSA9IG9wdGlvbnNbaV07XHJcbiAgICB9XHJcbiAgICB0aGlzLnRyYW5zbGF0ZVogPVxyXG4gICAgICB0aGlzLm9wdGlvbnMuSFdDb21wb3NpdGluZyAmJiBoYXNQZXJzcGVjdGl2ZSA/IFwidHJhbnNsYXRlWigwKVwiIDogXCJcIjtcclxuICAgIHRoaXMub3B0aW9ucy51c2VUcmFuc2l0aW9uID0gaGFzVHJhbnNpdGlvbiAmJiB0aGlzLm9wdGlvbnMudXNlVHJhbnNpdGlvbjtcclxuICAgIHRoaXMub3B0aW9ucy51c2VUcmFuc2Zvcm0gPSBoYXNUcmFuc2Zvcm0gJiYgdGhpcy5vcHRpb25zLnVzZVRyYW5zZm9ybTtcclxuXHJcbiAgICB0aGlzLm9wdGlvbnMuYm91bmNlRWFzaW5nID1cclxuICAgICAgdHlwZW9mIHRoaXMub3B0aW9ucy5ib3VuY2VFYXNpbmcgPT0gXCJzdHJpbmdcIlxyXG4gICAgICAgID8gZWFzZVt0aGlzLm9wdGlvbnMuYm91bmNlRWFzaW5nXSB8fCBlYXNlLmNpcmN1bGFyXHJcbiAgICAgICAgOiB0aGlzLm9wdGlvbnMuYm91bmNlRWFzaW5nO1xyXG5cclxuICAgIHRoaXMub3B0aW9ucy5yZXNpemVQb2xsaW5nID1cclxuICAgICAgdGhpcy5vcHRpb25zLnJlc2l6ZVBvbGxpbmcgPT09IHVuZGVmaW5lZFxyXG4gICAgICAgID8gNjBcclxuICAgICAgICA6IHRoaXMub3B0aW9ucy5yZXNpemVQb2xsaW5nO1xyXG4gICAgdGhpcy5vcHRpb25zLnRhcCAmJiAodGhpcy5vcHRpb25zLnRhcCA9IFwidGFwXCIpO1xyXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMudXNlVHJhbnNpdGlvbiAmJiAhdGhpcy5vcHRpb25zLnVzZVRyYW5zZm9ybSkge1xyXG4gICAgICB0aGlzLnNjcm9sbGVyU3R5bGUucG9zaXRpb24gPSBcInJlbGF0aXZlXCI7XHJcbiAgICB9XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnNocmlua1Njcm9sbGJhcnMgPT0gXCJzY2FsZVwiKSB7XHJcbiAgICAgIHRoaXMub3B0aW9ucy51c2VUcmFuc2l0aW9uID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB0aGlzLnggPSAwO1xyXG4gICAgdGhpcy55ID0gMDtcclxuICAgIHRoaXMuZGlyZWN0aW9uWCA9IDA7XHJcbiAgICB0aGlzLmRpcmVjdGlvblkgPSAwO1xyXG4gICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICB0aGlzLmluaXQoKTtcclxuICB9XHJcbiAgaW5pdCgpIHtcclxuICAgIHRoaXMuc2Nyb2xsVG8odGhpcy5vcHRpb25zLnN0YXJ0WCwgdGhpcy5vcHRpb25zLnN0YXJ0WSk7XHJcbiAgfVxyXG4gIHRyYW5zbGF0ZSh4LCB5KSB7XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnVzZVRyYW5zZm9ybSkge1xyXG4gICAgICB0aGlzLnNjcm9sbGVyU3R5bGVbXHJcbiAgICAgICAgXCJ0cmFuc2Zvcm1cIlxyXG4gICAgICBdID0gYHRyYW5zbGF0ZSgke3h9cHgsJHt5fXB4ICR7dGhpcy50cmFuc2xhdGVafSlgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeCA9IE1hdGgucm91bmQoeCk7XHJcbiAgICAgIHkgPSBNYXRoLnJvdW5kKHkpO1xyXG4gICAgICB0aGlzLnNjcm9sbGVyU3R5bGUubGVmdCA9IHggKyBcInB4XCI7XHJcbiAgICAgIHRoaXMuc2Nyb2xsZXJTdHlsZS50b3AgPSB5ICsgXCJweFwiO1xyXG4gICAgfVxyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgfVxyXG4gIHNjcm9sbFRvKHgsIHksIHRpbWUsIGVhc2luZykge1xyXG4gICAgZWFzaW5nID0gZWFzaW5nIHx8IGVhc2UuY2lyY3VsYXI7XHJcbiAgICB0aGlzLmlzSW50cmFuc2l0aW9uID0gdGhpcy5vcHRpb25zLnVzZVRyYW5zaXRpb24gJiYgdGltZSA+IDA7XHJcbiAgICBsZXQgdHJhbnNpdGlvblR5cGUgPSB0aGlzLm9wdGlvbnMudXNlVHJhbnNpdGlvbiAmJiBlYXNpbmcuc3R5bGU7XHJcbiAgICBpZiAoIXRpbWUgfHwgdHJhbnNpdGlvblR5cGUpIHtcclxuICAgICAgaWYgKHRyYW5zaXRpb25UeXBlKSB7XHJcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uVGltaW5nRnVuY3Rpb24oZWFzaW5nLnN0eWxlKTtcclxuICAgICAgICB0aGlzLnRyYW5zaXRpb25UaW1lKHRpbWUpO1xyXG4gICAgICB9XHJcbiAgICAgIHRoaXMudHJhbnNsYXRlKHgsIHkpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5hbmltYXRlKHgsIHksIHRpbWUsIGVhc2luZy5mbik7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGFuaW1hdGUoZGVzdFgsIGRlc3RZLCBkdXJhdGlvbiwgZWFzaW5nRm4pIHtcclxuICAgIHZhciB0aGF0ID0gdGhpcyxcclxuICAgICAgc3RhcnRYID0gdGhpcy54LFxyXG4gICAgICBzdGFydFkgPSB0aGlzLnksXHJcbiAgICAgIHN0YXJ0VGltZSA9IGdldFRpbWUoKSxcclxuICAgICAgZGVzdFRpbWUgPSBzdGFydFRpbWUgKyBkdXJhdGlvbjtcclxuXHJcbiAgICBmdW5jdGlvbiBzdGVwKCkge1xyXG4gICAgICB2YXIgbm93ID0gZ2V0VGltZSgpLFxyXG4gICAgICAgIG5ld1gsXHJcbiAgICAgICAgbmV3WSxcclxuICAgICAgICBlYXNpbmc7XHJcblxyXG4gICAgICBpZiAobm93ID49IGRlc3RUaW1lKSB7XHJcbiAgICAgICAgdGhhdC5pc0FuaW1hdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoYXQudHJhbnNsYXRlKGRlc3RYLCBkZXN0WSk7XHJcblxyXG4gICAgICAgIGlmICghdGhhdC5yZXNldFBvc2l0aW9uKHRoYXQub3B0aW9ucy5ib3VuY2VUaW1lKSkge1xyXG4gICAgICAgICAgdGhhdC5fZXhlY0V2ZW50KFwic2Nyb2xsRW5kXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBub3cgPSAobm93IC0gc3RhcnRUaW1lKSAvIGR1cmF0aW9uO1xyXG4gICAgICBlYXNpbmcgPSBlYXNpbmdGbihub3cpO1xyXG4gICAgICBuZXdYID0gKGRlc3RYIC0gc3RhcnRYKSAqIGVhc2luZyArIHN0YXJ0WDtcclxuICAgICAgbmV3WSA9IChkZXN0WSAtIHN0YXJ0WSkgKiBlYXNpbmcgKyBzdGFydFk7XHJcbiAgICAgIHRoYXQuX3RyYW5zbGF0ZShuZXdYLCBuZXdZKTtcclxuXHJcbiAgICAgIGlmICh0aGF0LmlzQW5pbWF0aW5nKSB7XHJcbiAgICAgICAgckFGKHN0ZXApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pc0FuaW1hdGluZyA9IHRydWU7XHJcbiAgICBzdGVwKCk7XHJcbiAgfVxyXG4gIHRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbihlYXNpbmcpIHtcclxuICAgIHRoaXMuc2Nyb2xsZXJTdHlsZVt0cmFuc2Zvcm1TdHlsZS50cmFuc2l0aW9uVGltaW5nRnVuY3Rpb25dID0gZWFzaW5nO1xyXG5cclxuICAgIGlmICh0aGlzLmluZGljYXRvcnMpIHtcclxuICAgICAgZm9yICh2YXIgaSA9IHRoaXMuaW5kaWNhdG9ycy5sZW5ndGg7IGktLTsgKSB7XHJcbiAgICAgICAgdGhpcy5pbmRpY2F0b3JzW2ldLnRyYW5zaXRpb25UaW1pbmdGdW5jdGlvbihlYXNpbmcpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHRyYW5zaXRpb25UaW1lKHRpbWUpIHtcclxuICAgIHRpbWUgPSB0aW1lIHx8IDA7XHJcbiAgICB2YXIgZHVyYXRpb25Qcm9wID0gdHJhbnNmb3JtU3R5bGUudHJhbnNpdGlvbkR1cmF0aW9uO1xyXG4gICAgaWYgKCFkdXJhdGlvblByb3ApIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuaW5kaWNhdG9yU3R5bGVbZHVyYXRpb25Qcm9wXSA9IHRpbWUgKyBcIm1zXCI7XHJcbiAgfVxyXG59XHJcbmV4cG9ydCBkZWZhdWx0IFNjcm9sbDtcclxuIl0sIm5hbWVzIjpbImhhc1BlcnNwZWN0aXZlIiwiaGFzVHJhbnNmb3JtIiwiaGFzVHJhbnNpdGlvbiIsIl9lbGVtZW50U3R5bGUiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJzdHlsZSIsIl92ZW5kb3IiLCJ2ZW5kb3JzIiwidHJhbnNmb3JtIiwiaSIsImwiLCJsZW5ndGgiLCJzdWJzdHIiLCJfcHJlZml4U3R5bGUiLCJjaGFyQXQiLCJ0b1VwcGVyQ2FzZSIsImVhc2UiLCJxdWFkcmF0aWMiLCJmbiIsImsiLCJjaXJjdWxhciIsIk1hdGgiLCJzcXJ0IiwiYmFjayIsImIiLCJib3VuY2UiLCJlbGFzdGljIiwiZiIsImUiLCJwb3ciLCJzaW4iLCJQSSIsInRyYW5zZm9ybVN0eWxlIiwidHJhbnNpdGlvblRpbWluZ0Z1bmN0aW9uIiwidHJhbnNpdGlvbkR1cmF0aW9uIiwidHJhbnNpdGlvbkRlbGF5IiwidHJhbnNmb3JtT3JpZ2luIiwidG91Y2hBY3Rpb24iLCJyQUYiLCJ3aW5kb3ciLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJ3ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJtb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJvUmVxdWVzdEFuaW1hdGlvbkZyYW1lIiwibXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJjYWxsYmFjayIsInNldFRpbWVvdXQiLCJnZXRUaW1lIiwiRGF0ZSIsIm5vdyIsIlNjcm9sbCIsImVsIiwib3B0aW9ucyIsIndyYXBwZXIiLCJxdWVyeVNlbGVjdG9yIiwiZ2VuZXJhdGVPcHRpb25zIiwic2Nyb2xsZXIiLCJjaGlsZHJlbiIsInNjcm9sbGVyU3R5bGUiLCJ0cmFuc2xhdGVaIiwiSFdDb21wb3NpdGluZyIsInVzZVRyYW5zaXRpb24iLCJ1c2VUcmFuc2Zvcm0iLCJib3VuY2VFYXNpbmciLCJyZXNpemVQb2xsaW5nIiwidW5kZWZpbmVkIiwidGFwIiwicG9zaXRpb24iLCJzaHJpbmtTY3JvbGxiYXJzIiwieCIsInkiLCJkaXJlY3Rpb25YIiwiZGlyZWN0aW9uWSIsIl9ldmVudHMiLCJpbml0Iiwic2Nyb2xsVG8iLCJzdGFydFgiLCJzdGFydFkiLCJyb3VuZCIsImxlZnQiLCJ0b3AiLCJ0aW1lIiwiZWFzaW5nIiwiaXNJbnRyYW5zaXRpb24iLCJ0cmFuc2l0aW9uVHlwZSIsInRyYW5zaXRpb25UaW1lIiwidHJhbnNsYXRlIiwiYW5pbWF0ZSIsImRlc3RYIiwiZGVzdFkiLCJkdXJhdGlvbiIsImVhc2luZ0ZuIiwidGhhdCIsInN0YXJ0VGltZSIsImRlc3RUaW1lIiwic3RlcCIsIm5ld1giLCJuZXdZIiwiaXNBbmltYXRpbmciLCJyZXNldFBvc2l0aW9uIiwiYm91bmNlVGltZSIsIl9leGVjRXZlbnQiLCJfdHJhbnNsYXRlIiwiaW5kaWNhdG9ycyIsImR1cmF0aW9uUHJvcCIsImluZGljYXRvclN0eWxlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBQUEsU0FBU0EsY0FBVCxHQUEwQjtFQUN4QixTQUFPLEtBQVA7RUFDRDs7RUFFRCxTQUFTQyxZQUFULEdBQXdCO0VBQ3RCLFNBQU8sS0FBUDtFQUNEOztFQUNELFNBQVNDLGFBQVQsR0FBeUI7RUFDdkIsU0FBTyxLQUFQO0VBQ0Q7O0VBQ0QsSUFBTUMsYUFBYSxHQUFHQyxRQUFRLENBQUNDLGFBQVQsQ0FBdUIsS0FBdkIsRUFBOEJDLEtBQXBEOztFQUNBLElBQU1DLE9BQU8sR0FBSSxZQUFZO0VBQzNCLE1BQUlDLE9BQU8sR0FBRyxDQUFDLEdBQUQsRUFBTSxTQUFOLEVBQWlCLE1BQWpCLEVBQXlCLEtBQXpCLEVBQWdDLElBQWhDLENBQWQ7RUFBQSxNQUNFQyxTQURGO0VBQUEsTUFFRUMsQ0FBQyxHQUFHLENBRk47RUFBQSxNQUdFQyxD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
