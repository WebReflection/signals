import { stack, type } from './core.js';

const disposed = new WeakSet;
const effects = new WeakMap;
const subscribers = new WeakMap;

const cleanUp = subscriber => {
  const tokens = effects.get(subscriber);
  const length = tokens.length;
  if (0 < length) {
    for (let i = 0; i < length; i++) dispose(tokens[i]);
    tokens.splice(0);
  }
};

export const dispose = token => {
  disposed.add(token);
  const subscriber = subscribers.get(token);
  if (subscriber) {
    cleanUp(subscriber);
    effects.delete(subscriber);
    subscribers.delete(token);
  }
};

export const effect = callback => {
  const subscriber = () => {
    if (invalid || disposed.has(token)) return;

    invalid = true;
    const length = stack.length;
    if (length < 1 || stack[length - 1] !== subscriber) run();
  };

  const run = () => {
    while (invalid) {
      cleanUp(subscriber);
      invalid = false;
      stack.push(subscriber);
      try { callback(token) }
      finally {
        stack.pop();
        if (disposed.has(token)) return;
      }
    }
  };

  const token = { [type]: 'effect' };

  let invalid = true, length = stack.length;

  if (0 < length) effects.get(stack[length - 1]).push(token);

  effects.set(subscriber, []);
  subscribers.set(token, subscriber);

  run();

  return token;
};
