import { run, stack } from './stack.js';

const effects = new WeakMap;

let batches;

/** @type {<T>(fn: () => T) => T} */
export const batch = fn => {
  let before = batches;
  if (!before) batches = [];
  try { return fn() }
  finally {
    if (!before) {
      [before, batches] = [batches, before];
      for (const [sub, loop] of before) {
        if (effects.has(sub)) loop();
      }
    }
  }
};

const cleanUp = state => {
  state.c?.();
  if (state.s.length) state.s.splice(0).forEach(dispose);
};

const dispose = subscriber => {
  const state = effects.get(subscriber);
  state.d = true;
  cleanUp(state);
  effects.delete(subscriber);
};

/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect = fn => {
  const subscriber = () => {
    if (invalid || state.d) return;
    invalid = true;
    if (!stack) {
      if (batches) batches.push([subscriber, loop]);
      else loop();
    }
  };

  const loop = () => {
    while (invalid) {
      invalid = false;
      cleanUp(state);
      state.c = run(subscriber, fn);
      if (state.d) return;
    }
  };

  let invalid = true, c, state = { s: [], d: !invalid, c };

  if (stack) effects.get(stack).s.push(subscriber);

  effects.set(subscriber, state);

  loop();

  return () => {
    if (!state.d) dispose(subscriber);
  };
};
