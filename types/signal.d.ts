export class Signal {
    constructor(value: any);
    set value(value: any);
    get value(): any;
    peek(): any;
    #private;
}
/** @type {<T>(init: T) => { value: T, peek: () => T }} */
export const signal: <T>(init: T) => {
    value: T;
    peek: () => T;
};
export let getValue: any;
export let getSubscribers: any;
export let setSubscribers: any;
