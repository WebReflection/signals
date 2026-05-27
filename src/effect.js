import { run, stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;

let batches;

/** @type {<T>(fn: () => T) => T} */
export const batch = fn => {
  let updates = batches;
  if (!updates) batches = [];
  try { return fn() }
  finally {
    if (!updates) {
      [updates, batches] = [batches, updates];
      for (const [subscriber, run] of updates) {
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
      if (batches) batches.push([subscriber, loop]);
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
