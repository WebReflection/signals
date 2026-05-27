/** @type {<T>(fn: () => T) => T} */
export const batch: <T>(fn: () => T) => T;
/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect: (fn: (() => void | (() => void))) => (() => void);
