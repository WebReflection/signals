import { isTracking, push } from './stack.js';

export const signal = current => {
  let subscribers = new Set;

  return {
    get value() {
      push(subscribers);
      return current;
    },

    set value(value) {
      current = value;
      if (isTracking()) {
        const before = subscribers;
        subscribers = new Set;
        for (const subscriber of before) subscriber();
      }
    },

    peek() {
      return current;
    },
  };
};
