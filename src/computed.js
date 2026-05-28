import { push, run } from './stack.js';

import { Signal, getValue, getSubscribers, setSubscribers } from './signal.js';

export class Computed extends Signal {
  #invalid = true;

  #result;

  get value() {
    push(getSubscribers(this));
    return this.peek();
  }

  $() {
    if (this.#invalid) return;
    this.#invalid = true;
    const before = getSubscribers(this);
    setSubscribers(this, new Set);
    for (const state of before) state.$();
  }

  peek() {
    while (this.#invalid) {
      this.#invalid = false;
      this.#result = run(this, getValue(this));
    }
    return this.#result;
  }
}

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed = fn => new Computed(fn);
