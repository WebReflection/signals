export const push = subscribers => {
  const length = stack.length;
  if (0 < length) subscribers.add(stack[length - 1]);
};

export const stack = [];

export const type = Symbol('type');
