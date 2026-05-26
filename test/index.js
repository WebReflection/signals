import { batch, computed, disposable, effect, signal, untracked } from '../dist/disposable.js';

// TEST 0
// const s = signal(1);
// const c = computed(() => s.value + 1);

// effect(() => {
//   const value = c.value;
//   console.log(value);
//   if (value < 4) s.value++;
//   else console.log('done');
// });


// setTimeout(() => {
//   s.value = 9;
//   console.log(c.value);
// }, 1000);


// TEST 1 & 2
const s1 = signal(1);
const s2 = signal(2);
const s3 = signal(3);

const c1 = computed(() => (s1.value + s2.value));
const c2 = computed(() => (s3.value + c1.value));

// TEST 1
// let count = 0;

// effect(() => {
//   console.log('c1', c2.value);
//   console.log('c2', c2.value);
//   count++;
//   console.log('count', count);
// });

// const fn = name => () => {
//   console.log(name);
//   s1.value++;
//   s2.value++;
//   s3.value++;
// };

// setTimeout(batch, 1000, fn('batch 1'));
// setTimeout(untracked, 2000, fn('untracked 1'));
// // setTimeout(fn('direct 1'), 3000);
// setTimeout(batch, 3000, fn('batch 2'));


// TEST 2
effect(() => {
  console.log('c1', c1.value);
  // console.log('c2', c2.value);

  if (c1.value < 4) {
    s1.value++;
    s2.value++;
  }

  effect(() => {
    console.log('s3', s3.value);
  });

  document.documentElement.onclick = () => {
    if (s2.value > 6) {
      if (s3.value++ > 10) {
        batch(() => {
          s2.value = 0;
          s3.value = 0;
        });
      }
    }
    else s2.value++;
  };
});

setTimeout(() => {
  s3.value++;
}, 1000);

setTimeout(() => {
  s3.value++;
}, 2000);

setTimeout(() => {
  s1.value++;
}, 3000);


// TEST 3
// const CounterModel = disposable((initialCount = 0) => {
//   const count = signal(initialCount);
//   const doubled = computed(() => count.value * 2);

//   effect(() => {
//     console.log("Count changed:", count.value);
//   });

//   return {
//     count,
//     doubled,
//     increment() {
//       count.value++;
//     },
//   };
// });


// setTimeout(() => {
//   const counter = new CounterModel(5);

//   counter.increment();
//   console.log('direct', counter.doubled.value);

//   counter[Symbol.dispose]();

//   for (let i = 0; i < 1000; i++) counter.increment();
// }, 5000);
