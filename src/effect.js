import { stack } from './stack.js';
import { Effect, dispose } from './classes.js';

/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect = fn => {
  const fx = new Effect(fn);
  if (stack) stack.sub.push(fx);
  fx.run();
  return () => {
    if (!fx.disposed) dispose(fx);
  };
};
