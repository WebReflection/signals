import { push } from './stack.js';

export const signal = current => {
  let subscribers = new Set;

  return {
    get raw() {
      return current;
    },

    get value() {
      push(subscribers);
      return current;
    },

    set value(value) {
      current = value;
      const set = subscribers;
      subscribers = new Set;
      for (const sub of set) sub();
    },
  };
};
