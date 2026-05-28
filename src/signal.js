import { push, tracking } from './stack.js';

/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal = init => {
  let subscribers = new Set;

  return {
    get value() {
      push(subscribers);
      return init;
    },

    set value(value) {
      init = value;
      if (tracking) {
        const before = subscribers;
        subscribers = new Set;
        for (const sub of before) sub();
      }
    },

    peek() {
      return init;
    },
  };
};
