# @webreflection/signals

<sup>**Social Media Photo by [Carlos Alberto Gómez Iñiguez](https://unsplash.com/@iniguez) on [Unsplash](https://unsplash.com/)**</sup>

[![Coverage Status](https://coveralls.io/repos/github/WebReflection/signals/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/signals?branch=main)

A minimalistic [Preact-like signals](https://github.com/preactjs/signals/blob/main/packages/core/README.md) implementation.

Once minified and compressed, this module is actually [0.5KB](https://cdn.jsdelivr.net/npm/@webreflection/signals/dist/signals.js).

### core
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

### disposable

Exposes a Preact-like [createModel](https://github.com/preactjs/signals/blob/main/packages/core/README.md#createmodelfn) utility with a `disposable` export.

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


### branded

This variant offers an `isSignal` utility that returns `true` or `false` if the passed argument is either a `signal` or a `computed` reference.

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

  * simply stack-based, maybe not the best approach, but one that can guarantee reasonable performance with minimal code size.
  * only `signal` and `computed` subscribe while reading values, unless `sig_or_comp.peek()` is used.
  * any `effect` updates synchronously but then runs only in isolation. Every effect is disposed of if the outer effect is running, meaning stacked effects work out of the box and always™ do the right thing.
  * `disposable` uses the very same `effect` logic to dispose itself when not needed anymore.
  * `batch` piles up subscribers and filters at the end for those that didn't get trashed in between (not perfect, yet fast).
  * `untracked` temporarily disables subscription in both read (for `symbol` and `computed`) and write (for `symbol` only).


#### Background

You know, nowadays it's hard to find libraries that are still 100% under control, minimalistic, not bloated, yet correct, and this one would like to be one of those 😇


#### The Beauty

  * [signal](https://github.com/WebReflection/signals/blob/main/src/signal.js) is 26 LOC.
  * [computed](https://github.com/WebReflection/signals/blob/main/src/computed.js) is 33 LOC.
  * the shared [stack](https://github.com/WebReflection/signals/blob/main/src/stack.js) is 18 LOC.
  * [effect](https://github.com/WebReflection/signals/blob/main/src/effect.js) is where business happens, 74 LOC.
  * [disposable](https://github.com/WebReflection/signals/blob/main/src/disposable.js) is 10 LOC, based on the core library mentioned in the previous points.
  * [branded](https://github.com/WebReflection/signals/blob/main/src/branded.js) is 25 LOC extra needed only for libraries building on top.

I mean ... that's coding, isn't it ... today I really needed something that would remind me why I love what I do ❤️


#### Benchmark

![benchmark](https://raw.githubusercontent.com/WebReflection/usignal/main/test/benchmark.png)

There is a *huge* difference between *NodeJS* and *Bun* but that's likely because *JSC* handles *Set* or *Map* in a better way, meaning all *WebKit* based browsers and mobile devices will have similar *Preact* performance, while *Chromium* based browsers will have half Preact size, but 1.5X slowdown.

However, in common scenarios with no more than 10 to 100 signals per *effect*, the performance are consistently better or really close to Preact.
