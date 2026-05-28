import { push, run } from './stack.js';

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed = fn => {
  let subscribers = new Set, invalid = true, value;

  const peek = () => {
    while (invalid) {
      invalid = false;
      value = run(subscriber, fn);
    }
    return value;
  };

  const subscriber = () => {
    if (invalid) return;
    invalid = true;
    const before = subscribers;
    subscribers = new Set;
    for (const sub of before) sub();
  };

  return {
    get value() {
      push(subscribers);
      return peek();
    },

    peek,
  };
};
