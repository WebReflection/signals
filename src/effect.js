import { run, stack } from './stack.js';

let batches;

/** @type {<T>(fn: () => T) => T} */
export const batch = fn => {
  let before = batches;
  if (!before) batches = [];
  try { return fn() }
  finally {
    if (!before) {
      [before, batches] = [batches, before];
      for (const [state, loop] of before) {
        if (!state.d) loop();
      }
    }
  }
};

const cleanUp = state => {
  state.c?.();
  if (state.s.length) state.s.splice(0).forEach(dispose);
};

const dispose = state => {
  state.d = true;
  cleanUp(state);
};

/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect = fn => {
  const subscriber = () => {
    if (invalid || state.d) return;
    invalid = true;
    if (!stack) {
      if (batches) batches.push([state, loop]);
      else loop();
    }
  };

  const loop = () => {
    while (invalid) {
      invalid = false;
      cleanUp(state);
      state.c = run(state, fn);
      if (state.d) return;
    }
  };

  let invalid = true, c, state = { $: subscriber, s: [], d: !invalid, c };

  if (stack) stack.s.push(state);

  loop();

  return () => {
    if (!state.d) dispose(state);
  };
};
