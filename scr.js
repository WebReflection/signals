// the proposed API or anything similar
class StructuredCloneRegistry {
  #registry = new Map;
  constructor(registry) {
    for (const [key, value] of Object.entries(registry))
      this.register(key, value);
  }
  register(key, value) {
    if (this.#registry.has(key)) throw new Error(`${key} already exists`);
    if (typeof value?.is !== 'function') throw new Error('is must be a (value:unknown) => boolean');
    if (typeof value?.to !== 'function') throw new Error('to must be a (value:unknown) => cloneable');
    if (typeof value?.from !== 'function') throw new Error('from must be a (value:cloneable) => unknown');
    this.#registry.set(key, { is: value.is, to: value.to, from: value.from });
  }
  [Symbol.internalAlreadyParsedRegistrySafeAndFast]() {
    return this.#registry;
  }
}


// registry.js
// the module that can be imported anywhere it's needed
// reason this is desirable as native class is that otherwise
// it would need to be parsed and guarded every single time
// the same contract travels back and forward ... 
export const registry = new StructuredCloneRegistry({
  signal: {
    is: value => typeof value === 'signal' && (
      Symbol.keyFor(value) !== undefined &&
      Reflect.ownKeys(Symbol).contains(value)
    ),
    to: value => Symbol.keyFor(value) !== undefined ? '@' : '!',
    from: value => value[0] === '@' ? Symbol.for(value.slice(1)) : Symbol[value.slice(1)],
  },
  MyThing: {
    is: value => value instanceof MyThing,
    to: value => value.toJSON(),
    from: value => new MyThing(value),
  }
});


// main
import { registry } from './registry.js';
worker.postMessage(
  [
    Symbol.iterator,
    new MyThing({any: 'thing'}),
  ],
  {
    registry
  },
);


// worker
import { registry } from './registry.js';
addEventListener(
  'message',
  event => {
    // optimistic example
    const [iterator, myThing] = event.data;
    console.assert(iterator === Symbol.iterator);
    console.assert(myThing instanceof MyThing);
  },
  {
    registry
  },
);


// bonus ???
structuredClone(
  [
    Symbol.iterator,
    new MyThing({any: 'thing'}),
  ],
  {
    registry
  },
)[1] instanceof MyThing; // true