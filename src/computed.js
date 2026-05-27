// @ts-nocheck

import { push, run } from './stack.js';

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed = fn => {
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
      value = run(subscriber, fn);
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
