let batches, getValue, getSubscribers, setSubscribers, stack, tracking = true;

/** @template T */
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

  /** @param {T} init */
  constructor(init) { this.#value = init }

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

/** @type {never} */
const compute = Symbol();

/**
 * @template T
 * @extends {Signal<() => T>}
 */
export class Computed extends Signal {
  #invalid = true;
  #result;

  [compute]() {
    if (this.#invalid) return;
    this.#invalid = true;
    const subscribers = getSubscribers(this);
    setSubscribers(this, new Set);
    notify(subscribers);
  }

  /** @readonly @returns {T} */
  get value() {
    push(getSubscribers(this));
    return this.peek();
  }

  /** @returns {T} */
  peek() {
    while (this.#invalid) {
      this.#invalid = false;
      this.#result = run(this, getValue(this));
    }
    return this.#result;
  }
}

class Effect {
  disposed = false;
  invalid = true;
  sub = [];
  cleanup;
  fn;

  constructor(fn) { this.fn = fn }

  [compute]() {
    if (this.invalid || this.disposed) return;
    this.invalid = true;
    if (!stack) {
      if (batches) batches.push(this);
      else this.peek();
    }
  }

  peek() {
    while (this.invalid && !this.disposed) {
      this.invalid = false;
      cleanup(this);
      this.cleanup = run(this, this.fn);
    }
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
      for (const fx of before) fx.peek();
    }
  }
};

const cleanup = fx => {
  fx.cleanup?.();
  if (fx.sub.length) fx.sub.splice(0).forEach(dispose);
};

/**
 * @template T
 * @param {() => T} fn
 * @returns {Computed<T>}
 */
export const computed = fn => new Computed(fn);

const dispose = fx => {
  fx.disposed = true;
  cleanup(fx);
};

/**
 * @param {() => (void | (() => void))} fn
 * @returns {() => void}
 */
export const effect = fn => {
  const fx = new Effect(fn);
  if (stack) stack.sub.push(fx);
  fx.peek();
  return () => {
    if (!fx.disposed) dispose(fx);
  };
};

const forceTracking = value => {
  tracking = value;
};

const notify = subscribers => {
  for (const subscriber of subscribers) subscriber[compute]();
};

const push = subscribers => {
  if (tracking && stack) subscribers.add(stack);
};

const run = (state, callback) => {
  const before = stack;
  stack = state;
  try { return callback() }
  finally { stack = before }
};

/**
 * @template T
 * @param {T} init
 * @returns
 */
export const signal = init => new Signal(init);

/** @type {<T>(fn: () => T) => T} */
export const untracked = fn => {
  const before = tracking;
  forceTracking(false); 
  try { return fn() }
  finally { forceTracking(before) }
};
