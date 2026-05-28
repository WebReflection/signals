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
