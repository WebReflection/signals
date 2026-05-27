export * from './disposable.js';
export * from './effect.js';
export * from './untracked.js';

import { computed as $computed } from './computed.js';
import { signal as $signal } from './signal.js';

const branded = new WeakSet;

export const computed = callback => {
  const computed = $computed(callback);
  branded.add(computed);
  return computed;
};

export const isSignal = value => branded.has(value);

export const signal = current => {
  const signal = $signal(current);
  branded.add(signal);
  return signal;
};
