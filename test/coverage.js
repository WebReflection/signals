import {
  Signal, Computed,
  batch,
  computed,
  disposable,
  effect,
  signal,
  untracked,
} from '../src/disposable.js';

const assert = (a, b, message) => {
  if (a !== b) {
    console.error({ a, b });
    throw new Error(message);
  }
};

const s1 = signal(1);
const s2 = signal(2);
const s3 = signal(3);

const c1 = computed(() => (s1.value + s2.value));
const c2 = computed(() => (s3.value + c1.value));

assert((s1 instanceof Signal), true, 's1 is a signal');
assert((c1 instanceof Signal), true, 'c1 is a signal');
assert((c1 instanceof Computed), true, 'c1 is a computed');

assert(s1.value, 1, 's1.value === 1');
assert(c1.value, 3, 'c1.value === 3');
assert(c2.value, 6, 'c2.value === 6');

s1.value = 2;
assert(c1.value, 4, 'c1.value === 4');
assert(c2.value, 7, 'c2.value === 7');

s2.value = 3;
assert(c1.value, 5, 'c1.value === 5');
assert(c2.value, 8, 'c2.value === 8');

const logs = [];

let dispose = effect(() => {
  logs.push(c1.value);
});

assert(logs.length, 1, 'logs.length === 1');
assert(logs[0], 5, 'logs[0] === 5');

s1.value++;
assert(logs.length, 2, 'logs.length === 2');
assert(logs[1], 6, 'logs[1] === 6');

untracked(() => {
  s1.value++;
});
assert(logs.length, 3, 'logs.length === 3');
assert(logs[2], 7, 'logs[2] === 7');

s1.value++;
assert(logs.length, 4, 'logs.length === 4');
assert(logs[3], 8, 'logs[3] === 8');


dispose();
s1.value++;
assert(logs.length, 4, 'logs.length === 4');
assert(c1.value, 9, 'c1.value === 9');

const tracked = signal(0);
const ignored = signal(0);

logs.splice(0);
dispose = effect(() => {
  logs.push(tracked.value, untracked(() => ignored.value));
});

assert(logs.join(','), '0,0', 'untracked() read');

ignored.value++;
assert(logs.join(','), '0,0', 'untracked() read');

tracked.value++;
assert(logs.join(','), '0,0,1,1', 'untracked() read');

dispose();

const count = signal(0);
const delta = signal(1);

logs.splice(0);
dispose = effect(() => {
  logs.push('run');
  count.value = untracked(() => count.value + delta.value);
});

assert(logs.join(','), 'run', 'untracked() update');
assert(count.value, 1, 'count.value === 1');

delta.value++;
assert(logs.join(','), 'run', 'untracked() update');
assert(count.value, 1, 'count.value === 1');

count.value++;
assert(logs.join(','), 'run', 'untracked() update');
assert(count.value, 2, 'count.value === 2');

dispose();

logs.splice(0);
dispose = disposable((initialCount = 0) => {
  const count = signal(initialCount);
  const doubled = computed(() => count.value * 2);

  effect(() => {
    logs.push(count.value);
  });

  return {
    count,
    doubled,
    increment() {
      count.value++;
    },
    decrement() {
      count.value--;
    }
  };
})(5);

assert(logs.length, 1, 'logs.length === 1');
assert(logs[0], 5, 'logs[0] === 5');

dispose.increment();

assert(logs.length, 2, 'logs.length === 2');
assert(logs[1], 6, 'logs[1] === 6');

dispose[Symbol.dispose]();

dispose.increment();

assert(logs.length, 2, 'logs.length === 2');
assert(logs[1], 6, 'logs[1] === 6');

const ref = {};
dispose = disposable((initialCount = 0) => {}).call(ref);

assert(dispose, ref, 'dispose === ref');

dispose[Symbol.dispose]();

logs.splice(0);
effect(() => {
  logs.push(s1.peek(), c2.peek());
});

assert(logs.join(','), '6,12', 'peek()');

s1.value++;
assert(logs.join(','), '6,12', 'peek()');
assert(c2.peek(), 13, 'c2.peek() === 12');

batch(() => {
  s1.value++;
  s1.value++;
  s1.value++;
});

assert(c2.peek(), 16, 'c2.peek() === 16');

logs.splice(0);
dispose = effect(() => {
  logs.push(c2.value);
});

batch(() => {
  s1.value++;
  s1.value++;
  s1.value++;
});

assert(c2.peek(), 19, 'c2.peek() === 19');

dispose();


logs.splice(0);

const twice = signal(0);

dispose = effect(() => {
  logs.push(twice.value);
  if (twice.value === 2) dispose();
});

twice.value++;
twice.value++;

assert(logs.join(','), '0,1,2', 'effect()');


const invalid = computed(() => s1.value + s2.value);

logs.splice(0);
const cleanups = [];
dispose = effect(() => {
  logs.push(invalid.value);
  return () => { cleanups.push('cleanup'); };
});

batch(() => {
  s1.value++;
  s2.value++;
});

assert(logs.join(','), '16,18', 'computed invalid');
assert(cleanups.length, 1, 'cleanups.length === 1');
assert(cleanups[0], 'cleanup', 'cleanups[0] === cleanup');
dispose();

assert(cleanups.length, 2, 'cleanups.length === 2');
assert(cleanups[0], 'cleanup', 'cleanups[0] === cleanup');
assert(cleanups[1], 'cleanup', 'cleanups[1] === cleanup');


logs.splice(0);

dispose = effect(() => {
  const value = s1.value;
  effect(() => () => {
    logs.push(value);
  });
});

assert(logs.length, 0, 'logs.length === 0');

s1.value++;

assert(logs.length, 1, 'logs.length === 1');

let value;
{
  using s1Gone = s1;
  using c1Gone = c1;
  assert(typeof s1.value, 'number', 's1.value is number');
  assert(typeof c1.value, 'number', 'c1.value is number');
  value = c1.value;
}

s1.value++;
assert(value, c1.value, 'value === c1.value');
