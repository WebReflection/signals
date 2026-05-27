export let tracking = true;

export const forceTracking = value => {
  tracking = value;
};

export let stack;

export const push = subscribers => {
  if (tracking && stack) subscribers.add(stack);
};

export const run = (subscriber, callback) => {
  const before = stack;
  stack = subscriber;
  try { return callback() }
  finally { stack = before }
};
