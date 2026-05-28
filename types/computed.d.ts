export class Computed extends Signal {
    get value(): any;
    $(): void;
    #private;
}
/** @type {<T>(fn: () => T) => { readonly value: T, peek: () => T }} */
export const computed: <T>(fn: () => T) => {
    readonly value: T;
    peek: () => T;
};
import { Signal } from './signal.js';
