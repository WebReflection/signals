export * from "./disposable.js";
export * from "./effect.js";
export * from "./untracked.js";
export function computed(callback: any): {
    readonly value: any;
    peek: () => any;
};
export function isSignal(value: any): boolean;
export function signal(current: any): {
    value: any;
    peek: () => any;
};
