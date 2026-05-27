import {
  batch,
  computed,
  disposable,
  effect,
  isSignal,
  signal,
  untracked,
} from '../src/branded.js';

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

assert(isSignal(s1), true, 's1 is a signal');
assert(isSignal(c1), true, 'c1 is a signal');

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
assert(logs.length, 2, 'logs.length === 2');

s1.value++;
assert(logs.length, 3, 'logs.length === 3');
assert(logs[2], 8, 'logs[1] === 8');


dispose();
s1.value++;
assert(logs.length, 3, 'logs.length === 3');
assert(c1.value, 9, 'c1.value === 9');

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
effect(() => {
  logs.push(invalid.value);
});

batch(() => {
  s1.value++;
  s2.value++;
});

assert(logs.join(','), '16,18', 'computed invalid');
