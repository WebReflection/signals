import { forceTracking, isTracking, run, stack } from './stack.js';

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

const drop = subscriber => {
  disposed.add(subscriber);
  cleanUp(subscriber);
  effects.delete(subscriber);
};

export const effect = callback => {
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
      run(subscriber, callback);
      if (disposed.has(subscriber)) return;
    }
  };

  let invalid = true;

  if (stack) effects.get(stack).push(subscriber);

  effects.set(subscriber, []);

  loop();

  return () => {
    if (effects.has(subscriber)) drop(subscriber);
  };
};

export const untracked = callback => {
  const before = isTracking();
  forceTracking(false); 
  try { callback() }
  finally { forceTracking(before) }
};
