# DRIVEPAD protocol

The protocol is reserved for the next milestone. It will be versioned and validated, with sequence numbers, timestamps, heartbeat/watchdog semantics, stale-packet rejection, and capability negotiation.

The canonical controller state will use normalized values:

- steering: `-1.0..1.0`
- throttle, brake, clutch, handbrake: `0.0..1.0`
- digital controls: explicit pressed/released state

The Windows bridge must reset all state when a valid packet has not been received within the configured watchdog timeout.
