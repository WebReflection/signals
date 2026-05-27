import { push, run } from './stack.js';

export const computed = callback => {
  let subscribers = new Set, invalid = true, value;

  const subscriber = () => {
    if (invalid) return;
    invalid = true;
    const before = subscribers;
    subscribers = new Set;
    for (const subscriber of before) subscriber();
  };

  const get = () => {
    while (invalid) {
      invalid = false;
      value = run(subscriber, callback);
    }
    return value;
  };

  return {
    get value() {
      push(subscribers);
      return get();
    },

    peek() {
      return get();
    },
  };
};
