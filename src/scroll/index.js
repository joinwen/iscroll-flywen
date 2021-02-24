import {
  hasPerspective,
  hasTransform,
  hasTransition,
  ease,
  transformStyle,
  rAF,
  getTime,
} from "../utils/index";

const EventUtil = {
  addEvent: (el, type, fn, capture) => {
    el.addEventListener(type, fn, !!capture);
  },
  removeEvent: (el, type, fn, capture) => {
    el.removeEvent(type, fn, !!capture);
  },
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
    this.initEvents();
    if (this.options.mouseWheel) {
      this.initWheel();
    }
    this.scrollTo(this.options.startX, this.options.startY);
  }
  on(type, fn) {
    if (!this._events[type]) {
      this._events[type] = [];
    }
    this._events[type].push(fn);
  }
  off(type, fn) {
    if (!this._events[type]) {
      return;
    }
    let index = this._events[type].indexOf(fn);
    if (index > -1) {
      this._events[type].splice(index, 1);
    }
  }
  destroy() {
    this.initEvents(true);
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = null;
    this.execEvent("destroy");
  }
  execEvent() {}
  initEvents(remove) {
    let eventType = remove ? EventUtil.removeEvent : EventUtil.addEvent,
      target = this.options.bindToWrapper ? this.wrapper : window;
    eventType(window, "orientationchange", this);
    eventType(window, "resize", this);
  }
  initWheel() {
    EventUtil.addEvent(this.wrapper, "wheel", this);
    EventUtil.addEvent(this.wrapper, "mousewheel", this);
    EventUtil.addEvent(this.wrapper, "DOMMouseScroll", this);

    this.on("destroy", function () {
      clearTimeout(this.wheelTimeout);
      this.wheelTimeout = null;
      EventUtil.removeEvent(this.wrapper, "wheel", this);
      EventUtil.removeEvent(this.wrapper, "mousewheel", this);
      EventUtil.removeEvent(this.wrapper, "DOMMouseScroll", this);
    });
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
  handleEvent(e) {
    switch (e.type) {
      case "mousedown":
        console.log("mousedown");
        break;
      case "mousemove":
        console.log("mousemove");
        break;
      case "mouseup":
      case "mousecancel":
        console.log("mouseup mousecancel");
        break;
      case "orientationchange":
      case "resize":
        console.log("orientationchange resize");
        break;
      case "transitionend":
      case "mousewheel":
      case "wheel":
        console.log("transitionend mousewheel wheel");
        break;
      case "keydown":
        console.log("keydown");
        break;
      case "click":
        console.log("click");
        break;
    }
  }
}
export default Scroll;
