# Phase 7 — mobile Wi-Fi pairing and safety tests

The PWA now has an honest Wi-Fi pairing panel and a browser-native authenticated WebSocket client. It uses Web Crypto for the same SHA-256/HMAC challenge proof as the Node bridge and sends the existing compact controller packets.

The panel requires the URL, session ID, pairing code, and nonce printed by the development bridge. It explicitly identifies QR scanning as pending rather than showing a non-functional scanner.

Safety integration tests cover watchdog timeout release and the requirement that a reconnect starts with a fresh sequence gate.

The virtual-controller provider is still intentionally unavailable. No game-controller output is claimed.
