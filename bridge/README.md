# Bridge architecture

The Windows bridge is intentionally not a fake controller. Its implementation will be added only with a verified Windows backend.

Planned boundaries:

- `bridge/transport/ConnectionTransport`: authenticated WebSocket and future USB/Bluetooth transports.
- `bridge/protocol`: decoder, version negotiation, sequence validation, heartbeat, and watchdog.
- `bridge/virtual-controller/VirtualControllerProvider`: replaceable provider interface.
- `bridge/diagnostics`: packet counters, latency, and provider health.

The watchdog must call `releaseAll()` when a valid packet has not arrived within the configured timeout. A reconnect must receive a fresh controller state before output is re-enabled. No game-specific injection or unverified virtual-controller claim is permitted.
