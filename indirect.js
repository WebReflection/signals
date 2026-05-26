const signals = new WeakMap;

class Signal {
  #subscribers = [];
  #value;
  constructor(value) {
    this.#value = value;
  }
  get value() {
    return this.#value;
  }
  set value(value) {
    this.#value = value;
    for (const subscriber of this.#subscribers.splice(0))
      subscriber(value);
  }
  subscribe(callback) {
    this.#subscribers.push(callback);
    return this;
  }
}
