import { forceTracking, isTracking, stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;
const batches = [];

let batching = false;

export const batch = callback => {
  const handle = !batching;
  if (handle) batching = true;
  try { callback() }
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
      invalid = false;
      cleanUp(subscriber);
      stack.push(subscriber);
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
  const before = isTracking();
  if (before) forceTracking(false); 
  try { callback() }
  finally { forceTracking(before) }
};
