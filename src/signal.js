import { Signal } from './classes.js';

/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal = init => new Signal(init);
