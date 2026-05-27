export * from './disposable.js';
export * from './effect.js';
export * from './untracked.js';

import { computed as $computed } from './computed.js';
import { signal as $signal } from './signal.js';

const branded = new WeakSet;

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed = fn => {
  const computed = $computed(fn);
  branded.add(computed);
  return computed;
};

/** @type {(value: unknown) => boolean} */
export const isSignal = value => branded.has(value);

/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal = init => {
  const signal = $signal(init);
  branded.add(signal);
  return signal;
};
