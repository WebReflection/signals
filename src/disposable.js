// @ts-nocheck

export * from './index.js';
import { effect } from './effect.js';

const { defineProperty } = Object;
const { dispose } = Symbol;

export const disposable = callback => function disposable(...args) {
  let ref, value = effect(() => {
    ref ??= callback.apply(this, args) ?? this;
  });
  return defineProperty(ref, dispose, { value });
};
