import { forceTracking, tracking } from './stack.js';

/** @type {<T>(fn: () => T) => T} */
export const untracked = fn => {
  const before = tracking;
  forceTracking(false); 
  try { return fn() }
  finally { forceTracking(before) }
};
