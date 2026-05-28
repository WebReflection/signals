export * from "./disposable.js";
export * from "./effect.js";
export * from "./untracked.js";
/** @type {(value: unknown) => boolean} */
export const isSignal: (value: unknown) => boolean;
export { batch };
import { batch } from './classes.js';
