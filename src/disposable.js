export * from './index.js';
import { effect } from './index.js';

export const disposable = fn => function disposable(...args) {
  let ref, value = effect(() => {
    ref ??= fn.apply(this, args) ?? this;
  });
  ref[Symbol.dispose] = value;
  return ref;
};
