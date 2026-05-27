import { forceTracking, isTracking } from './stack.js';

/** @type {<T>(fn: () => T) => T} */
export const untracked = fn => {
  const before = isTracking();
  forceTracking(false); 
  try { return fn() }
  finally { forceTracking(before) }
};
