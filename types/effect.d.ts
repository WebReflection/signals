import { batch } from './classes.js';
/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect: (fn: (() => void | (() => void))) => (() => void);
export { batch };
