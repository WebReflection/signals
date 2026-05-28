import { Signal } from './classes.js';

/** @type {<T>(init: T) => { value: T, peek: () => T }} */
const signal = init => new Signal(init);

export { Signal, signal };
