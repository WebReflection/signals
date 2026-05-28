import { Signal } from './classes.js';
/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal: <T>(init: T) => {
    value: T;
    peek: () => T;
};
export { Signal };
