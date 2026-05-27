export * from "./disposable.js";
export * from "./effect.js";
export * from "./untracked.js";
/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed: <T>(fn: () => T) => {
    readonly value: T;
    peek: () => T;
};
/** @type {(value: unknown) => boolean} */
export const isSignal: (value: unknown) => boolean;
/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal: <T>(init: T) => {
    value: T;
    peek: () => T;
};
