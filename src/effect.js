import { stack } from './stack.js';

const disposed = new WeakSet;
const effects = new WeakMap;

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

    // run only if top of the stack
    if (!stack.length) run();

    // ⚠️ before:
    // run with no stack or when latest stack is not the same one
    // const length = stack.length;
    // if (length < 1 || stack[length - 1] !== subscriber) run();
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
