import { push, stack } from './stack.js';

export const computed = callback => {
  const subscriber = () => {
    if (invalid) return;
    invalid = true;
    const set = subscribers;
    subscribers = new Set;
    for (const sub of set) sub();
  };

  let subscribers = new Set, invalid = true, value;

  return {
    get raw() {
      return value;
    },

    get value() {
      while (invalid) {
        invalid = false;
        push(subscribers);
        stack.push(subscriber);
        try { value = callback() }
        finally { stack.pop() }
      }
      return value;
    },
  };
};
