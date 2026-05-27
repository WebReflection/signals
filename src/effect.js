import { run, stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;
const batches = [];

let batching = false;

/** @type {<T>(fn: () => T) => T} */
export const batch = fn => {
  const handle = !batching;
  if (handle) batching = true;
  try { return fn() }
  finally {
    if (handle) {
      batching = false;
      for (const [subscriber, run] of batches.splice(0)) {
        if (!disposed.has(subscriber)) run();
      }
    }
  }
};

const cleanUp = subscriber => {
  const subscribers = effects.get(subscriber);
  const length = subscribers.length;
  if (length) {
    for (const subscriber of subscribers.splice(0)) {
      drop(subscriber);
    }
  }
};

const drop = subscriber => {
  disposed.add(subscriber);
  cleanUp(subscriber);
  effects.delete(subscriber);
};

/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect = fn => {
  const subscriber = () => {
    if (invalid || disposed.has(subscriber)) return;
    invalid = true;
    if (!stack) {
      if (batching) batches.push([subscriber, loop]);
      else loop();
    }
  };

  const loop = () => {
    while (invalid) {
      invalid = false;
      cleanUp(subscriber);
      clean?.();
      clean = run(subscriber, fn);
      if (disposed.has(subscriber)) return;
    }
  };

  let invalid = true, clean;

  if (stack) effects.get(stack).push(subscriber);

  effects.set(subscriber, []);

  loop();

  return () => {
    if (effects.has(subscriber)) {
      clean?.();
      drop(subscriber);
    }
  };
};
