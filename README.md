# @webreflection/signals

<sup>**Social Media Photo by [Carlos Alberto Gómez Iñiguez](https://unsplash.com/@iniguez) on [Unsplash](https://unsplash.com/)**</sup>

[![Coverage Status](https://coveralls.io/repos/github/WebReflection/signals/badge.svg?branch=main)](https://coveralls.io/github/WebReflection/signals?branch=main)

A minimalistic [Preact-like signals](https://github.com/preactjs/signals/blob/main/packages/core/README.md) implementation.

Once minified and compressed, this module is actually [0.5KB](https://cdn.jsdelivr.net/npm/@webreflection/signals/dist/signals.js).

### core
```js
// basic core features
import {
  Signal,     // class for brand check
  Computed,   // extends Signal: brand check
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
  // all other exports from core
  ...core
} from '@webreflection/signals/disposable';
```


### In Depth

  * simply (swapped) stack-based, maybe not the best approach, but one that can guarantee reasonable performance with minimal code size.
  * only `signal` and `computed` subscribe while reading values, unless `sig_or_comp.peek()` is used.
  * any `effect` updates synchronously but then runs only in isolation. Every effect is disposed of if the outer effect is running, meaning stacked effects work out of the box and always™ do the right thing.
  * `disposable` uses the very same `effect` logic to dispose itself when not needed anymore.
  * `batch` piles up subscribers and filters at the end for those that didn't get trashed in between (not perfect, yet fast).
  * `untracked` temporarily disables subscription in both read (for `symbol` and `computed`) and write (for `symbol` only).


#### Background

You know, nowadays it's hard to find libraries that are still 100% under control, minimalistic, not bloated, yet correct, and this one would like to be one of those 😇


#### Benchmark

![benchmark](https://raw.githubusercontent.com/WebReflection/usignal/main/test/benchmark.png)


## Architecture

Fine-tuned signals are a piece of art:

  * fastest possible feedback
  * linked graphs with bitwise flags deciding what to do and/or when (alien-signals)
  * transpiled and understood ahead of time to produce the best possible outcome (Svelte, SolidJS)
  * ad-hoc or coupled DOM manipulation
  * specific to JSX syntax (Preact or alternatives)
  * ... other attempts/variants out there

That is all good and fine, yet the graph behind *signals* is, *imho*, pretty simple in theory (clearly hard in practice) ... and I will tell you how this module keeps that *simple* concept in mind.

<details>
  <summary><strong>Signals</strong></summary>
  <div>

These are just a *value wrapper*: you reach that *value*? You are subscribing to it. You change that *value*? You are triggering anything listening to that *signal* reference after subscribing.

That's it, that's the contract!

Here, there is a `.peek()` method to avoid subscribing, but any time you access a `signal.value`, you are subscribing to it if you are either a *computed* reference or an *event* one.

  </div>
</details>

<details>
  <summary><strong>Computed</strong></summary>
  <div>

It's a `signal` by all means, because once you reach its `value`, it subscribes to any *subscriber*, just like any *signal* would do.

The main difference between *computed* and *signal* is that *computed* is a **read-only** contract, and it expects a callback as an argument that will "*brand*" that computed *type* from then on.

Everything else is the same: you cannot `computed.value = anything` but you can always retrieve `computed.value` to subscribe to that computed.

When a dependency changes, a *computed* is not immediately executed again: it is simply marked as *invalid*. That invalid state is also a guard, because once a *computed* is already known to be stale there is no reason to notify its subscribers again for every other signal change happening in the same flow, or while that *computed* is already resolving itself. The next `.value` or `.peek()` access refreshes it once, producing the latest result from the current state.

  </div>
</details>

<details>
  <summary><strong>Effect</strong></summary>
  <div>

This is the whole orchestration around *signals* or *computed* that makes anything **reactive**, but because it's a *bottom-up* situation we're dealing with, things might feel overly complicated. In theory, that's not the case.

```js
const num = signal(0);

const dispose = effect(() => {
  // subscribe to this signal state
  const value = num.value;

  // make this effect able to dispose itself
  if (2 <= value) {
    // no further changes to num will be observed
    dispose();
  }
  else {
    console.log({ value });
  }
});

// logs: { value: 0 }

// increment by 1
num.value++;
// logs: { value: 1 }

// increment by 1
num.value++;
// logs nothing!

// drop reactivity explicitly!
dispose();

// increment by 1
num.value++;
// also logs nothing!
```

In this example, the *effect* subscribes to `num` changes, but it seppukus itself once its `value` reaches the number `2` or above ("*how is that possible?*" ... you'll learn that in a bit!).

The architecture in this example is also easy to explain: any *signal* or *computed* value that is reached will consider its outer *effect* a potential subscriber!

The important difference in this module is that *effect* has no notion of what it subscribed to. It's the *signal* or *computed* that retains that information, not the consumer, and that's simply because invoking any foreign *callback* doesn't mean you know what happens within that *callback*. Not knowing what happens is indeed a great way to understand this architecture.

Long story short, any *callback* executing within an *effect* is registered as a consumer of the current *signal* or *computed* reference that is required to provide a `.value` while the *callback* is happening, so the relation is from *signal* or *computed* to any running *callback*, if **any**.


#### Effect in details

No *effect*? No reactivity! This is the *signals* contract, but there is a *catch*:

  * what if an *effect* is within another *effect*?
  * how can **conditional** operators ditch what *sub-effect* should run and what shouldn't?

Great questions. Here are the details about why that's never a concern:

  * *effect* never add subscribers to itself, like signals or computeds do, it just registers itself as an *observer* (*subscriber*)
  * *effect* never runs if it knows outer *effects* are queued to resolve the latest change or changes are happening while it's running
  * the previous point means if `signal.value` is registered both at the *inner* effect level and at the *outer* one, the *outer* one will dictate the execution because ...
  * only the top-most subscribed effects will eventually execute, and ...
  * any *effect* previously registered for its outer *effect* will be **disposed** and never react to anything again!

I am not sure you are still following, but because *effect* is a bottom-up problem, top-down is clearly the solution, and that's granted by the registration **stack**, where the outer *effect* runs before the *inner effect*. That solves everything!

The same *invalid* guard used by *computed* values applies to *effects* too: when multiple signals ask the same *effect* to refresh, only the first invalidation matters until that *effect* has actually run again. This avoids repeated work, avoids repeated notifications, and prevents an *effect* from recursively refreshing itself while its own callback is still on the stack.

  </div>
</details>

<details>
  <summary><strong>Batch</strong></summary>
  <div>

If you followed everything else I've explained around this architecture, `batch(callback)` simply represents a running *callback* with no instant reactivity, it simply accumulates changes and trigger after all changes happend for whatever effect was involved.

  </div>
</details>

<details>
  <summary><strong>Untracked</strong></summary>
  <div>

This utility basically runs updates and whatnot like *batch*, but it will never register itself while doing that execution, resulting in a safe hook for foreign functions that wouldn't otherwise belong to our logic. They are just interested in our data instead, and that's fine!

  </div>
</details>


## Differences from Preact Signals

This module aims to be *Preact-like*, not a byte-for-byte or behavior-for-behavior clone of Preact Signals. The goal is to keep the core small, predictable, and easy to reason about, while still exposing `Signal` and `Computed` classes for projects that want to specialize any behavior.

The following differences are intentional tradeoffs:

  * assigning the same value still notifies subscribers. If you want distinct-value semantics, extend `Signal` and provide your own factory:

```js
import { Signal as WRSignal } from '@webreflection/signals';

class Signal extends WRSignal {
  get value() {
    return super.value;
  }

  set value(value) {
    if (!Object.is(this.peek(), value)) {
      super.value = value;
    }
  }
}

export const signal = value => new Signal(value);
```

  * conditional dependencies are not pruned after every run. Instead, subscribers are kept by the signal or computed reference and are pruned lazily when that source notifies again, skipping disposed effects along the way. If a source is no longer referenced, normal garbage collection takes care of it; if it is still referenced, the next notification keeps the final value valid and fast enough to retrieve without maintaining a more complex dependency graph.

  * mixed direct signal reads and derived computed reads can observe an intermediate stale computed value in the same effect, because there is no graph ordering involved. For example, reading both `count.value` and `doubled.value` where `doubled` is computed from `count` can briefly see the updated `count` with the previous `doubled` before the computed invalidation catches up. This is the little extra cost paid by a not-so-common scenario to keep the library as small as it is.

  * `batch(callback)` coalesces execution, but it does not perform Preact's final-value reconciliation. This follows from the first point: signals do not compare old and new values, so `signal.value = signal.value` is still a notification. That can be a desirable pattern in some cases; for every other "don't do that" case, extend `Signal` as shown above.

  * `effect(callback)` callbacks must return either `void` or a cleanup function, as specified by the TypeScript contract. Returning any other value is unsupported and will throw later if that value is invoked as cleanup.

  * extra Preact APIs such as `subscribe`, `valueOf`, `toJSON`, and `action` are outside the minimal core. You can extend the exported classes to add the hooks that make sense for your project. Preact's `createModel` API surface is covered as much as this module needs by the explicit `@webreflection/signals/disposable` entry point and its `disposable` exported utility, so model-style disposal stays available when imported on purpose without being embedded into the default signals primitive.

#### Please Note

Because the public shape intentionally follows the Preact Signals API, this module can also be replaced by the real Preact Signals package whenever a project needs its full graph, helpers, or framework integrations. In that sense, it is meant to make the API familiar without forcing anyone to keep using this smaller implementation, or its intentional constraints, forever.
