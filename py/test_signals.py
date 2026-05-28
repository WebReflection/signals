from signals import Computed, Signal, batch, computed, effect, signal, untracked


def assert_is(actual, expected, message):
    if actual is not expected:
        raise AssertionError("%s: %r is not %r" % (message, actual, expected))


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError("%s: %r != %r" % (message, actual, expected))


def increment(sig):
    sig.value += 1


def test_core():
    s1 = signal(1)
    s2 = signal(2)
    s3 = signal(3)

    c1 = computed(lambda: s1.value + s2.value)
    c2 = computed(lambda: s3.value + c1.value)

    assert_is(isinstance(s1, Signal), True, "s1 is a signal")
    assert_is(isinstance(c1, Signal), True, "c1 is a signal")
    assert_is(isinstance(c1, Computed), True, "c1 is a computed")

    assert_equal(s1.value, 1, "s1.value == 1")
    assert_equal(c1.value, 3, "c1.value == 3")
    assert_equal(c2.value, 6, "c2.value == 6")

    s1.value = 2
    assert_equal(c1.value, 4, "c1.value == 4")
    assert_equal(c2.value, 7, "c2.value == 7")

    s2.value = 3
    assert_equal(c1.value, 5, "c1.value == 5")
    assert_equal(c2.value, 8, "c2.value == 8")

    logs = []

    dispose = effect(lambda: logs.append(c1.value))

    assert_equal(len(logs), 1, "logs length after first effect")
    assert_equal(logs[0], 5, "logs[0] == 5")

    increment(s1)
    assert_equal(len(logs), 2, "logs length after s1 increment")
    assert_equal(logs[1], 6, "logs[1] == 6")

    untracked(lambda: increment(s1))
    assert_equal(len(logs), 3, "logs length after untracked increment")
    assert_equal(logs[2], 7, "logs[2] == 7")

    increment(s1)
    assert_equal(len(logs), 4, "logs length after second s1 increment")
    assert_equal(logs[3], 8, "logs[3] == 8")

    dispose()
    increment(s1)
    assert_equal(len(logs), 4, "disposed effect does not run")
    assert_equal(c1.value, 9, "c1.value == 9")

    tracked = signal(0)
    ignored = signal(0)

    logs[:] = []

    def read_tracked():
        logs.append(tracked.value)
        logs.append(untracked(lambda: ignored.value))

    dispose = effect(read_tracked)

    assert_equal(logs, [0, 0], "untracked read")

    increment(ignored)
    assert_equal(logs, [0, 0], "ignored update does not run effect")

    increment(tracked)
    assert_equal(logs, [0, 0, 1, 1], "tracked update runs effect")

    dispose()

    count = signal(0)
    delta = signal(1)

    logs[:] = []

    def update_count():
        logs.append("run")
        count.value = untracked(lambda: count.value + delta.value)

    dispose = effect(update_count)

    assert_equal(logs, ["run"], "untracked update initial run")
    assert_equal(count.value, 1, "count.value == 1")

    increment(delta)
    assert_equal(logs, ["run"], "untracked delta update does not run")
    assert_equal(count.value, 1, "count.value still == 1")

    increment(count)
    assert_equal(logs, ["run"], "untracked count update does not run")
    assert_equal(count.value, 2, "count.value == 2")

    dispose()

    logs[:] = []

    def peek_effect():
        logs.append(s1.peek())
        logs.append(c2.peek())

    effect(peek_effect)

    assert_equal(logs, [6, 12], "peek does not subscribe")

    increment(s1)
    assert_equal(logs, [6, 12], "peek effect does not rerun")
    assert_equal(c2.peek(), 13, "c2.peek() == 13")

    def batch_updates():
        increment(s1)
        increment(s1)
        increment(s1)

    batch(batch_updates)

    assert_equal(c2.peek(), 16, "c2.peek() == 16")

    logs[:] = []

    dispose = effect(lambda: logs.append(c2.value))

    batch(batch_updates)

    assert_equal(c2.peek(), 19, "c2.peek() == 19")

    dispose()

    logs[:] = []

    twice = signal(0)
    holder = {}

    def twice_effect():
        logs.append(twice.value)

        if twice.value == 2:
            holder["dispose"]()

    holder["dispose"] = effect(twice_effect)

    increment(twice)
    increment(twice)

    assert_equal(logs, [0, 1, 2], "effect can dispose itself")

    invalid = computed(lambda: s1.value + s2.value)

    logs[:] = []
    cleanups = []

    def invalid_effect():
        logs.append(invalid.value)
        return lambda: cleanups.append("cleanup")

    dispose = effect(invalid_effect)

    def invalid_updates():
        increment(s1)
        increment(s2)

    batch(invalid_updates)

    assert_equal(logs, [16, 18], "computed invalidates once in batch")
    assert_equal(len(cleanups), 1, "cleanup runs before rerun")
    assert_equal(cleanups[0], "cleanup", "cleanup value")

    dispose()

    assert_equal(len(cleanups), 2, "cleanup runs on dispose")
    assert_equal(cleanups[0], "cleanup", "first cleanup value")
    assert_equal(cleanups[1], "cleanup", "second cleanup value")

    logs[:] = []

    def outer_effect():
        value = s1.value
        effect(lambda: lambda: logs.append(value))

    effect(outer_effect)

    assert_equal(len(logs), 0, "nested cleanup has not run")

    increment(s1)

    assert_equal(len(logs), 1, "nested cleanup runs once")


if __name__ == "__main__":
    test_core()
    print("ok")
