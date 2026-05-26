import { push, stack } from './stack.js';

export const computed = callback => {
  let subscribers = new Set, invalid = true, value;

  const subscriber = () => {
    if (invalid) return;
    invalid = true;
    const set = subscribers;
    subscribers = new Set;
    for (const sub of set) sub();
  };

  return {
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

    peek() {
      return value;
    },
  };
};
