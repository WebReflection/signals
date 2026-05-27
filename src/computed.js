import { push, stack } from './stack.js';

export const computed = callback => {
  let subscribers = new Set, invalid = true, value;

  const subscriber = () => {
    if (invalid) return;
    invalid = true;
    const before = subscribers;
    subscribers = new Set;
    for (const subscriber of before) subscriber();
  };

  return {
    get value() {
      push(subscribers);
      while (invalid) {
        invalid = false;
        stack.push(subscriber);
        try { value = callback() }
        finally { stack.pop() }
      }
      return value;
    },

    peek() {
      return value;
    },
  };
};
