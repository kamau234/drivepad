# Bridge architecture

The Windows bridge is intentionally not a fake controller. Its implementation remains a verified, opt-in runtime boundary that only engages when a maintained provider is available.

Planned boundaries:

- `bridge/transport`: authenticated WebSocket and future USB/Bluetooth transports.
- `bridge/security`: pairing verification and challenge-handshake security.
- `bridge/virtual-controller`: `VirtualControllerProvider` abstraction and concrete providers.
- `bridge/diagnostics`: packet counters, latency, provider health, and watchdog state.

The watchdog must call `releaseAll()` when a valid packet has not arrived within the configured timeout. A reconnect must receive a fresh controller state before output is re-enabled. No game-specific process injection is allowed.

The bridge should expose a diagnostic status and a tray lifecycle only when a verified provider is active. Otherwise it must remain honest and disabled.
