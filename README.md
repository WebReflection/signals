# @webreflection/signals

A minimalistic [Preact-like signals](https://preactjs.com/guide/v10/signals/) implementation.

Once minified and compressed, this module is actually [0.5KB](https://cdn.jsdelivr.net/npm/@webreflection/signals/dist/signals.js).

##### core 
```js
// basic core features
import {
  batch,      // Preact-like API
  computed,   // Preact-like API
  effect,     // Preact-like API
  signal,     // Preact-like API
  untracked,  // Preact-like API
} from '@webreflection/signals';
```

##### disposable

Exposes Preact-like [createModel](https://github.com/preactjs/signals/blob/main/packages/core/README.md#createmodelfn) utility with a `disposable` export.

```js
// extra core features
import {
  // extra:
  disposable, // equivalent of createModel(fn)
  // ... same as core features ...
  batch,
  computed,
  effect,
  signal,
  untracked,
} from '@webreflection/signals/disposable';
```


##### branded

This variant offers an `isSignal` utility that returns `true` or `false` if the passed argument is either  `signal` or a `computed` reference.

```js
// extra core features
import {
  // extra:
  disposable, // equivalent of createModel(fn)
  isSignal,   // true if `isSignal(ref)` is signal or computed
  // ... same as core features ...
  batch,
  computed,
  effect,
  signal,
  untracked,
} from '@webreflection/signals/branded';
```

### In Depth

  * simply stack based, maybe not the fastest approach but one that can guarantee reasonable performance for minimal code-size.
  * only `signal` and `computed` subscribe while reading values, unless `sig_or_comp.peek()` is used.
  * any `effect` update synchronously but then runs only in isolation. Every effect is disposed if the outer effect is running, meaning, stacked effects work out of the box and always™ do the right thing.
  * `disposable` uses very same `effect` logic to dispose itself when not needed anymore.
  * `batch` piles up subscribers and filters at the end for those that didn't get trashed in between (not perfect, yet fast)
  * `untracked` temporarely disable subscription in both read (for `symbol` and `computed`) and write (for `symbol` only)

There are tons of tests I need to do to be sure all the things are actually working as expected but so far the scratched surface of this logic pleased me in a way that I hope it can be still extremely robust and simple by all means ... you know, nowadays it's hard to find libraries that are still 100% under control, minimalistic, not bloated, yet correct, this one would like to be one of those 😇

#### The Beauty

  * [signal](https://github.com/WebReflection/signals/blob/main/src/signal.js) is 25 LOC.
  * [computed](https://github.com/WebReflection/signals/blob/main/src/computed.js) is 30 LOC.
  * the shared [stack](https://github.com/WebReflection/signals/blob/main/src/stack.js) is 16 LOC.
  * [effect](https://github.com/WebReflection/signals/blob/main/src/effect.js) is where business happens, 80 LOC.
  * [disposable](https://github.com/WebReflection/signals/blob/main/src/disposable.js) is 12 LOC, based on the core library mentioned in previous points.
  * [branded](https://github.com/WebReflection/signals/blob/main/src/branded.js) is 21 LOC extra needed only for libraries building on top.

I mean ... that's coding, isn't it ... today I really needed something that would remind me why I love what I do ❤️
