import { push, run, stack, tracking } from './stack.js';

const computed = Symbol();

let batches, getValue, getSubscribers, setSubscribers, runComputed;

const notify = subscribers => {
  for (const subscriber of subscribers) {
    (subscriber[computed] ? runComputed : runEffect).call(subscriber);
  }
};

export class Signal {
  static {
    getValue = self => self.#value;
    getSubscribers = self => self.#subscribers;
    setSubscribers = (self, subscribers) => {
      self.#subscribers = subscribers;
    };
  }

  #subscribers = new Set;
  #value;

  constructor(value) { this.#value = value }

  get value() {
    push(this.#subscribers);
    return this.#value;
  }

  set value(value) {
    this.#value = value;
    if (tracking) {
      const subscribers = this.#subscribers;
      this.#subscribers = new Set;
      notify(subscribers);
    }
  }

  peek() {
    return this.#value;
  }
}

export class Computed extends Signal {
  static {
    runComputed = function () {
      if (this.#invalid) return;
      this.#invalid = true;
      const subscribers = getSubscribers(this);
      setSubscribers(this, new Set);
      notify(subscribers);
    };
  }

  #invalid = true;
  #result;

  get [computed]() { return true }

  get value() {
    push(getSubscribers(this));
    return this.peek();
  }

  peek() {
    while (this.#invalid) {
      this.#invalid = false;
      this.#result = run(this, getValue(this));
    }
    return this.#result;
  }
}

/** @type {<T>(fn: () => T) => T} */
export const batch = fn => {
  let before = batches;
  if (!before) batches = [];
  try { return fn() }
  finally {
    if (!before) {
      [before, batches] = [batches, before];
      for (const fx of before) {
        if (!fx.disposed) fx.run();
      }
    }
  }
};

const cleanUp = fx => {
  fx.cleanup?.();
  if (fx.sub.length) fx.sub.splice(0).forEach(dispose);
};

export const dispose = fx => {
  fx.disposed = true;
  cleanUp(fx);
};


export class Effect {
  disposed = false;
  invalid = true;
  sub = [];

  cleanup;
  fn;

  constructor(fn) { this.fn = fn }

  get [computed]() { return false }

  run() {
    while (this.invalid) {
      this.invalid = false;
      cleanUp(this);
      this.cleanup = run(this, this.fn);
      if (this.disposed) return;
    }
  }
}

function runEffect() {
  if (this.invalid || this.disposed) return;
  this.invalid = true;
  if (!stack) {
    if (batches) batches.push(this);
    else this.run();
  }
}
