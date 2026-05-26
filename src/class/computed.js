
// 🤔 is branding even worth it?
import { push, stack } from '../stack.js';

import { Signal, get, notify, set, subscribers } from './signal.js';

export class Computed extends Signal {
  #subscriber = () => {
    if (this.#invalid) return;
    this.#invalid = true;
    notify(this);
  };

  #invalid = true;

  #callback;

  constructor(callback) {
    super();
    this.#callback = callback;
  }

  get raw() {
    return get(this);
  }

  get value() {
    while (this.#invalid) {
      this.#invalid = false;
      push(subscribers(this));
      stack.push(this.#subscriber);
      try { set(this, this.#callback()) }
      finally { stack.pop() }
    }
    return get(this);
  }
}

export const computed = callback => new Computed(callback);
