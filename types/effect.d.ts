/** @type {(fn: (() => void | (() => void))) => (() => void)} */
export const effect: (fn: (() => void | (() => void))) => (() => void);
