import { stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;
const batches = [];

let batching = false;
let tracking = true;

export const batch = callback => {
  const before = batching;
  if (!before) batching = true;
  try { callback() }
  finally {
    if (!before) {
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

const dispose = subscriber => {
  if (effects.has(subscriber)) {
    drop(subscriber);
  }
};

const drop = subscriber => {
  disposed.add(subscriber);
  cleanUp(subscriber);
  effects.delete(subscriber);
};

export const effect = callback => {
  const subscriber = () => {
    if (invalid || disposed.has(subscriber)) return;
    invalid = true;
    if (!stack.length) {
      if (batching) batches.push([subscriber, run]);
      else run();
    }
  };

  const run = () => {
    while (invalid) {
      cleanUp(subscriber);
      stack.push(subscriber);
      invalid = false;
      try { callback() }
      finally {
        stack.pop();
        if (disposed.has(subscriber)) return;
      }
    }
  };

  let invalid = true, length = stack.length;

  if (length) effects.get(stack[length - 1]).push(subscriber);

  effects.set(subscriber, []);

  run();

  return () => dispose(subscriber);
};

export const untracked = callback => {
  const before = tracking;
  if (before) tracking = false;
  try { callback() }
  finally { tracking = before }
};
