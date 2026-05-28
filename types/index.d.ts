export class Signal<T> {
    [x: number]: () => void;
    constructor(init: T);
    set value(value: T);
    get value(): T;
    peek(): T;
    #private;
}
export class Computed<T> extends Signal<() => T> {
    constructor(init: () => T);
    readonly get value(): T;
    peek(): T;
    #private;
}
export const batch: <T>(fn: () => T) => T;
export function computed<T>(fn: () => T): Computed<T>;
export function effect(fn: () => (void | (() => void))): () => void;
export function signal<T>(init: T): Signal<T>;
export const untracked: <T>(fn: () => T) => T;
