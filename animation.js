// A single interface for onMouseDown/Move/Up and onTouchStart/Move/End
class PanGesture {
  constructor(events) {
    this.isTouching = false;
    this.lastX = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.events = events;
    this.velocity = 0;
  }

  getEvents() {
    return {
      onMouseDown: this.onMouseDown.bind(this),
      onMouseMove: this.onMouseMove.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onTouchStart: this.onTouchStart.bind(this),
      onTouchMove: this.onTouchMove.bind(this),
      onTouchEnd: this.onTouchEnd.bind(this),
    };
  }

  updateFromEvent(x, y) {
    var deltaTime = Date.now() - this.lastTime;
    var deltaX = x - this.lastX;
    var deltaY = y - this.lastY;

    if (deltaTime !== 0) {
      this.velocity =
        0.5 * this.velocity +
        (0.5 * (deltaX / deltaTime) + (0.5 * (deltaY / deltaTime))) / 2;
    }

    this.lastTime = Date.now();
    this.lastX = x;
    this.lastY = y;
  }

  onStart(x, y) {
    this.isTouching = true;
    this.lastX = x;
    this.lastY = y;
    this.lastTime = Date.now();
    this.events.onStart && this.events.onStart();
  }

  onUpdate(x, y) {
    if (!this.isTouching) {
      return;
    }
    var deltaX = x - this.lastX;
    var deltaY = y - this.lastY;
    this.updateFromEvent(x, y);
    this.events.onUpdate && this.events.onUpdate(deltaX, deltaY);
  }

  onEnd(x, y) {
    this.isTouching = false;
    this.updateFromEvent(x, y);
    this.events.onEnd && this.events.onEnd(this.velocity);
  }

  onTouchStart(event) {
    this.onStart(event.touches[0].pageX, event.touches[0].pageY);
    event.preventDefault();
  }
  onTouchMove(event) {
    this.onUpdate(event.touches[0].pageX, event.touches[0].pageY);
    event.preventDefault();
  }
  onTouchEnd(event) {
    this.onEnd(this.lastX, this.lastY);
    event.preventDefault();
  }

  onMouseDown(event) {
    this.onStart(event.clientX, event.clientY);
  }
  onMouseMove(event) {
    this.onUpdate(event.clientX, event.clientY);
  }
  onMouseUp(event) {
    this.onEnd(event.clientX, event.clientY);
  }
};

// A single interface for onMouseDown/Move/Up and onTouchStart/Move/End
class ScanGesture {
  constructor(events) {
    this.isTouching = false;
    this.lastY = 0;
    this.lastTime = 0;
    this.events = events;
    this.velocity = 0;
  }

  getEvents() {
    return {
      onMouseDown: this.onMouseDown.bind(this),
      onMouseMove: this.onMouseMove.bind(this),
      onMouseUp: this.onMouseUp.bind(this),
      onTouchStart: this.onTouchStart.bind(this),
      onTouchMove: this.onTouchMove.bind(this),
      onTouchEnd: this.onTouchEnd.bind(this),
    };
  }

  updateFromEvent(x) {
    var deltaY = x - this.lastY;
    var deltaTime = Date.now() - this.lastTime;
    if (deltaTime !== 0) {
      this.velocity =
        0.5 * this.velocity +
        0.5 * (deltaY / deltaTime);
    }
    this.lastTime = Date.now();
    this.lastY = x;
  }

  onStart(x) {
    this.isTouching = true;
    this.lastY = x;
    this.lastTime = Date.now();
    this.events.onStart && this.events.onStart();
  }

  onUpdate(x) {
    if (!this.isTouching) {
      return;
    }
    var delta = x - this.lastY;
    this.updateFromEvent(x);
    this.events.onUpdate && this.events.onUpdate(delta);
  }

  onEnd(x) {
    this.isTouching = false;
    this.updateFromEvent(x);
    this.events.onEnd && this.events.onEnd(this.velocity);
  }

  onTouchStart(event) {
    this.onStart(event.touches[0].pageY);
    event.preventDefault();
  }
  onTouchMove(event) {
    this.onUpdate(event.touches[0].pageY);
    event.preventDefault();
  }
  onTouchEnd(event) {
    this.onEnd(this.lastY);
    event.preventDefault();
  }

  onMouseDown(event) {
    this.onStart(event.clientY);
  }
  onMouseMove(event) {
    this.onUpdate(event.clientY);
  }
  onMouseUp(event) {
    this.onEnd(event.clientY);
  }
};

class Loop {
  constructor(events) {
    this.events = events;
  }

  start(duration) {
    this.startTime = Date.now();
    this.endTime = this.startTime + duration;

    requestAnimationFrame(this.onUpdate.bind(this));
    this.events.onStart && this.events.onStart();
  }

  onUpdate() {
    var progress = (Date.now() - this.startTime) / (this.endTime - this.startTime);
    this.events.onUpdate && this.events.onUpdate(progress);

    if (Date.now() < this.endTime) {
      this.raf = requestAnimationFrame(this.onUpdate.bind(this));
    } else {
      this.events.onEnd && this.events.onEnd();
    }
  }

  stop() {
    cancelAnimationFrame(this.raf);
  }
}

class Animation {
  constructor(events) {
    this.easing = events.easing;
    this.events = events;
    this.to = events.to;
    this.from = events.from;
    this.loop = new Loop({
      onStart: this.onStart.bind(this),
      onUpdate: this.onUpdate.bind(this),
      onEnd: this.onEnd.bind(this),
    });
    this.loop.start(events.duration);
  }

  stop() {
    this.loop.stop();
  }

  onStart() {
    this.lastProgress = 0;
    this.events.onStart && this.events.onStart();
  }

  onUpdate(progress) {
    var newValue = (this.easing(progress) - this.easing(this.lastProgress)) * (this.to - this.from);
    this.lastProgress = progress;
    this.events.onUpdate && this.events.onUpdate(newValue);
  }

  onEnd() {
    this.events.onEnd && this.events.onEnd();
  }
}


class Easing {
  constructor({easing, mode}) {
    this.easing = easing || (t => t);
    this.mode = mode || 'in';
  }

  getEasing() {
    if (this.mode === 'in') {
      return this.easing;
    }

    if (this.mode === 'out') {
      return (t => 1 - this.easing(1 - t));
    }

    if (this.mode === 'in-out') {
      return (t => {
        if (t < 0.5) {
          return this.easing(t * 2) / 2;
        } else {
          return 1 - this.easing((1 - t) * 2) / 2;
        }
      });
    }

    throw new Error('invalid mode');
  }
}

// Check this cool website to view all the easing functions
// http://xaedes.de/dev/transitions/

Easing.poly = (n) => (t) => Math.pow(t, n);
Easing.linear = Easing.poly(1);
Easing.quad = Easing.poly(2);
Easing.cubic = Easing.poly(3);
Easing.elastic = function(a, p) {
  var tau = Math.PI * 2;
  var s;
  if (arguments.length < 2) {
    p = 0.45;
  }
  if (arguments.length) {
    s = p / tau * Math.asin(1 / a);
  } else {
    a = 1;
    s = p / 4;
  }
  return function(t) {
    return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * tau / p);
  };
};


class ValueBinding {
  constructor(value) {
    this.value = value;
    this.bindings = [];
  }

  addBinding(binding) {
    this.bindings.push(binding);
  }

  release() {
    this.bindings = [];
  }

  valueOf() {
    return this.value;
  }

  update(value) {
    this.value = value;
    this.bindings.forEach((binding) => binding.update(value));
  }
}

class InterpolationBinding {
  constructor(interpolation, value) {
    this.value = interpolation.interpolateToNumber(value);
    this.interpolation = interpolation;
    this.bindings = [];
  }

  addBinding(binding) {
    this.bindings.push(binding);
  }

  valueOf() {
    return this.value;
  }

  update(value) {
    this.value = this.interpolation.interpolateToNumber(value);
    this.bindings.forEach((binding) => binding.update(this.value));
  }
}

class TransformBinding {
  constructor(obj) {
    this.obj = obj;
    this.bindings = [];
    for (var key in this.obj) {
      this.obj[key].addBinding && this.obj[key].addBinding(this);
    }
  }

  addBinding(binding) {
    this.bindings.push(binding);
  }

  valueOf() {
    var result = '';
    for (var key in this.obj) {
      if (key == 'translateX' || key == 'translateY') {
        result += key + '(' + this.obj[key] + 'px' + ') ';
      } else if (key == 'rotate') {
        result += key + '(' + this.obj[key] + 'deg) ';
      } else {
        result += key + '(' + this.obj[key] + ') ';
      }
    }
    return result;
  }

  update(value) {
    this.bindings.forEach((binding) => binding.update(this.valueOf()));
  }
}

class ReactStyleBinding {
  constructor(reactID, attribute) {
    this.reactID = reactID;
    this.attribute = attribute;
    this.bindings = [];
  }

  update(value) {
    document.querySelector('[data-reactid="' + this.reactID + '"]').style[this.attribute] = value;
  }
}

class Interpolation {
  constructor({inputRange, outputRange, easing, extrapolate}) {
    this.inputRange = inputRange || [0, 1];
    if (this.inputRange[1] - this.inputRange[0] === 0) {
      throw new Error('inputRange must be non empty');
    }

    this.outputRange = outputRange || [0, 1];
    if (this.outputRange[1] - this.outputRange[0] === 0) {
      throw new Error('outputRange must be non empty');
    }

    if (this.inputRange.length !== this.outputRange.length) {
      throw new Error(
        'inputRange (' + this.inputRange.length + ') and outputRange (' +
        this.outputRange.length + ') must have the same length'
      );
    }

    this.easing = easing || (t => t);
    this.extrapolate = extrapolate === undefined ? false : extrapolate;
  }

  _interpolate(input, inputMin, inputMax, outputMin, outputMax, easing, extrapolate) {
    var result = input;

    // Extrapolate
    if (!extrapolate) {
      if (result < inputMin) {
        result = inputMin;
      } else if (result > inputMax) {
        result = inputMax;
      }
    }

    // Input Range
    result = (result - inputMin) / (inputMax - inputMin);

    // Easing
    result = easing(result);

    // Output Range
    result = result * (outputMax - outputMin) + outputMin;

    return result;
  }

  _findRange(input) {
    for (var i = 1; i < this.inputRange.length - 1; ++i) {
      if (this.inputRange[i] >= input) {
        break;
      }
    }
    return i - 1;
  }

  interpolateToNumber(input) {
    var range = this._findRange(input);
    return this._interpolate(
      input,
      this.inputRange[range],
      this.inputRange[range + 1],
      this.outputRange[range],
      this.outputRange[range + 1],
      this.easing,
      this.extrapolate
    );
  }

  interpolate(input) {
    var result = new InterpolationBinding(this, input);
    input && typeof input === 'object' && input.addBinding && input.addBinding(result);
    return result;
  }
}
