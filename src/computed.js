import { push, run } from './stack.js';

class Computed {
  #subscribers = new Set;
  #invalid = true;

  #fn;
  #value;

  constructor(fn) { this.#fn = fn }

  get value() {
    push(this.#subscribers);
    return this.peek();
  }

  $() {
    if (this.#invalid) return;
    this.#invalid = true;
    const before = this.#subscribers;
    this.#subscribers = new Set;
    for (const state of before) state.$();
  }

  peek() {
    while (this.#invalid) {
      this.#invalid = false;
      this.#value = run(this, this.#fn);
    }
    return this.#value;
  }
}

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed = fn => new Computed(fn);
