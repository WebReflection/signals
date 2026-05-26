# @webreflection/signals

A minimalistic [Preact-like signals](https://preactjs.com/guide/v10/signals/) implementation.

Once minified and compressed, this module is actually [0.6kB](https://cdn.jsdelivr.net/npm/@webreflection/signals/dist/signals.js).

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

```js
// extra core features
import {
  // extra:
  disposable, // equivalent of createModule(fn)
  // ... same as core features ...
  batch,
  computed,
  effect,
  signal,
  untracked,
} from '@webreflection/signals/disposable';
```

### In Depth

  * simply stack based, maybe not the fastest approach but one that can guarantee reasonable performance for minimal code-size.
  * only `signal` and `computed` subscribe while reading values, unless `sig_or_comp.peek()` is used.
  * any `effect` update synchronously but then runs only in isolation. Every effect is disposed if the outer effect is running, meaning, stacked effects work out of the box and always™ do the right thing.
  * `disposable` uses very same `effect` logic to dispose itself when not needed anymore.
  * `batch` piles up subscribers and filters at the end for those that didn't get trashed in between (not perfect, yet fast)
  * `untracked` temporarely disable subscription in both read (for `symbol` and `computed`) and write (for `symbol` only)

There are tons of tests I need to do to be sure all the things are actually working as expected but so far the scratched surface of this logic pleased me in a way that I hope it can be still extremely robust and simple by all means ... you know, nowadays it's hard to find libraries that are still 100% under control, minimalistic, not bloated, yet correct, this one would like to be one of those 😇
