# Phase 5 — authenticated-session and safety boundaries

This phase adds secure pairing-session lifecycle, an explicit packet gate, watchdog semantics, and the replaceable Windows controller-provider contract.

Pairing codes and nonces use the platform cryptographic random source. Sessions expire and may be revoked. A paired device must present both its session ID and device ID.

The bridge safety boundary rejects duplicate/out-of-order packets. A watchdog releases every output on timeout, disconnect, or emergency release. Reconnection must reset the packet gate and remain inactive until a fresh packet arrives.

`VirtualControllerProvider` deliberately contains no driver-specific code. A Windows implementation must be added and verified against the selected maintained backend before claiming that Windows exposes a controller.
