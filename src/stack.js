export const push = subscribers => {
  const length = stack.length;
  if (length) subscribers.add(stack[length - 1]);
};

export const stack = [];
