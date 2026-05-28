__all__ = (
    "Signal",
    "Computed",
    "batch",
    "computed",
    "effect",
    "signal",
    "untracked",
)


_batches = None
_stack = None


class _SubscriberSet:
    def __init__(self):
        self._items = {}

    def add(self, item):
        self._items[item] = None

    def __iter__(self):
        return iter(self._items)


class Signal:
    def __init__(self, init):
        self._subscribers = _SubscriberSet()
        self._value = init

    @property
    def value(self):
        _push(self._subscribers)
        return self._value

    @value.setter
    def value(self, value):
        self._value = value
        _notify(self)

    def peek(self):
        return self._value


class Computed(Signal):
    def __init__(self, fn):
        Signal.__init__(self, fn)
        self._invalid = True
        self._result = None

    def _compute(self):
        if self._invalid:
            return
        self._invalid = True
        _notify(self)

    @property
    def value(self):
        _push(self._subscribers)
        return self.peek()

    def peek(self):
        while self._invalid:
            self._invalid = False
            self._result = _run(self, self._value)
        return self._result


class _Effect:
    def __init__(self, fn):
        self.disposed = False
        self.invalid = True
        self.sub = []
        self.cleanup = None
        self.fn = fn

    def _compute(self):
        global _batches

        if self.invalid or self.disposed:
            return

        self.invalid = True

        if _stack is None:
            if _batches is not None:
                _batches.append(self)
            else:
                self.peek()

    def peek(self):
        while self.invalid and not self.disposed:
            self.invalid = False
            _cleanup(self)
            self.cleanup = _run(self, self.fn)


def _notify(self):
    subscribers = self._subscribers
    self._subscribers = _SubscriberSet()

    for subscriber in subscribers:
        subscriber._compute()


def _cleanup(fx):
    if fx.cleanup is not None:
        fx.cleanup()

    if fx.sub:
        sub = fx.sub
        fx.sub = []

        for child in sub:
            _dispose(child)


def _dispose(fx):
    fx.disposed = True
    _cleanup(fx)


def _push(subscribers):
    if _stack is not None:
        subscribers.add(_stack)


def _run(state, callback):
    global _stack

    before = _stack
    _stack = state

    try:
        return callback()
    finally:
        _stack = before


def batch(fn):
    global _batches

    before = _batches

    if before is None:
        _batches = []

    try:
        return fn()
    finally:
        if before is None:
            queued = _batches
            _batches = before

            for fx in queued:
                fx.peek()


def computed(fn):
    return Computed(fn)


def effect(fn):
    fx = _Effect(fn)

    if _stack is not None:
        _stack.sub.append(fx)

    fx.peek()

    def dispose():
        if not fx.disposed:
            _dispose(fx)

    return dispose


def signal(init):
    return Signal(init)


def untracked(fn):
    global _stack

    before = _stack
    _stack = None

    try:
        return fn()
    finally:
        _stack = before
