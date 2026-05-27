import {
  batch,
  computed,
  disposable,
  effect,
  isSignal,
  signal,
  untracked,
} from '../src/branded.js';

const s1 = signal(1);
const s2 = signal(2);
const s3 = signal(3);

const c1 = computed(() => (s1.value + s2.value));
const c2 = computed(() => (s3.value + c1.value));

console.assert(isSignal(s1), 's1 is a signal');
console.assert(isSignal(c1), 'c1 is a signal');

console.assert(s1.value === 1, 's1.value === 1');
console.assert(c1.value === 3, 'c1.value === 3');
console.assert(c2.value === 6, 'c2.value === 6');

s1.value = 2;
console.assert(c1.value === 4, 'c1.value === 4');
console.assert(c2.value === 7, 'c2.value === 7');

s2.value = 3;
console.assert(c1.value === 5, 'c1.value === 5');
console.assert(c2.value === 8, 'c2.value === 8');

const logs = [];

let dispose = effect(() => {
  logs.push(c1.value);
});

console.assert(logs.length === 1, 'logs.length === 1');
console.assert(logs[0] === 5, 'logs[0] === 5');

s1.value++;
console.assert(logs.length === 2, 'logs.length === 2');
console.assert(logs[1] === 6, 'logs[1] === 6');
