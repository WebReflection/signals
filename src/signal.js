import { push, tracking } from './stack.js';

class Signal {
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
      const before = this.#subscribers;
      this.#subscribers = new Set;
      for (const state of before) state.$();
    }
  }

  peek() {
    return this.#value;
  }
}

/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal = init => new Signal(init);
