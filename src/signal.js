import { isTracking, push } from './stack.js';

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
      if (isTracking()) {
        const before = subscribers;
        subscribers = new Set;
        for (const subscriber of before) subscriber();
      }
    },

    peek() {
      return init;
    },
  };
};
