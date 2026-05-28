export let tracking = true;

export const forceTracking = value => {
  tracking = value;
};

export let stack;

export const push = subscribers => {
  if (tracking && stack) subscribers.add(stack);
};

export const run = (state, callback) => {
  const before = stack;
  stack = state;
  try { return callback() }
  finally { stack = before }
};
