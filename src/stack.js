let tracking = true;

export const forceTracking = value => {
  tracking = value;
};

export const isTracking = () => tracking;

export const push = subscribers => {
  if (tracking) {
    const length = stack.length;
    if (length) subscribers.add(stack[length - 1]);
  }
};

export const stack = [];
