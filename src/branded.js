export * from './disposable.js';
export * from './effect.js';
export * from './untracked.js';

import { batch } from './classes.js';
import { Signal } from './classes.js';

/** @type {(value: unknown) => boolean} */
export const isSignal = value => value instanceof Signal;

export { batch };
