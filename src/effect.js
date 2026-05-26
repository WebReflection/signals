import { stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;

let batches = null;

export const batch = callback => {
  batches = [];
  try { callback() }
  finally {
    const stack = batches;
    batches = null;
    for (const [subscriber, run] of stack) {
      if (!disposed.has(subscriber)) run();
    }
  }
};

const cleanUp = subscriber => {
  const subscribers = effects.get(subscriber);
  const length = subscribers.length;
  if (length) {
    for (let i = 0; i < length; i++) drop(subscribers[i]);
    subscribers.splice(0);
  }
};

const drop = subscriber => {
  disposed.add(subscriber);
  cleanUp(subscriber);
  effects.delete(subscriber);
};

export const dispose = subscriber => {
  if (!effects.has(subscriber)) return;
  drop(subscriber);
};

export const effect = callback => {
  const subscriber = () => {
    if (invalid || disposed.has(subscriber)) return;
    invalid = true;
    if (!stack.length) {
      if (batches) batches.push([subscriber, run]);
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

  return subscriber;
};
