export function dispose(fx: any): void;
export class Signal {
    constructor(value: any);
    set value(value: any);
    get value(): any;
    peek(): any;
    #private;
}
export class Computed extends Signal {
    get value(): any;
    get [computed](): boolean;
    #private;
}
/** @type {<T>(fn: () => T) => T} */
export const batch: <T>(fn: () => T) => T;
export class Effect {
    constructor(fn: any);
    disposed: boolean;
    invalid: boolean;
    sub: any[];
    cleanup: any;
    fn: any;
    run(): void;
    get [computed](): boolean;
}
declare const computed: unique symbol;
export {};
