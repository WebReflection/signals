import { Computed } from './classes.js';

/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
const computed = fn => new Computed(fn);

export { Computed, computed };
