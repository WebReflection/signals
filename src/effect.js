import { stack } from './stack.js';
import { Effect, batch, dispose } from './classes.js';

/** @type {(fn: (() => void | (() => void))) => (() => void)} */
const effect = fn => {
  const fx = new Effect(fn);
  if (stack) stack.sub.push(fx);
  fx.run();
  return () => {
    if (!fx.disposed) dispose(fx);
  };
};

export { batch, effect };
