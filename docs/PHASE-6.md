# Phase 6 — Windows transport runtime boundary

Added a localhost-bound WebSocket bridge runtime with:

- Challenge/proof authentication using pairing code and session nonce.
- Base64-wrapped fixed-size controller packets.
- Fresh authentication required after every reconnect.
- Packet gate and 250 ms watchdog release behavior.
- Runtime diagnostics for connection, packet, sequence, and watchdog state.
- A Windows-side output boundary that refuses to claim a controller until a maintained backend is installed.

This phase intentionally does **not** claim that Windows sees a game controller. `bridge/runtime.ts` uses an unavailable provider and is a transport/safety test runtime only. The production follow-up is selecting, implementing, and manually verifying a maintained Windows virtual-controller backend and installer.
