import { Computed } from './classes.js';
/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed: <T>(fn: () => T) => {
    readonly value: T;
    peek: () => T;
};
export { Computed };
