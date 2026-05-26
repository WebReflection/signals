// 🤔 is branding even worth it?

import { push } from '../stack.js';

let get, notify, set, subscribers;

export class Signal {
  static {
    get = self => self.#value;

    notify = self => {
      const subscribers = self.#subscribers;
      self.#subscribers = new Set;
      for (const subscriber of subscribers) subscriber();
    };

    set = (self, value) => {
      self.#value = value;
      notify(self);
    };

    subscribers = self => self.#subscribers;
  }

  #value;
  #subscribers = new Set;

  constructor(value) {
    this.#value = value;
  }

  get raw() {
    return this.#value;
  }

  get value() {
    push(this.#subscribers);
    return this.#value;
  }

  set value(value) {
    set(this, value);
  }
}

export { get, notify, set, subscribers };

export const signal = value => new Signal(value);
