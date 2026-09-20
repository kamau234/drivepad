# Phase 6 transport corrections

The bridge now derives the client proof with the exact same `SHA-256(upperCase(code):nonce)` key derivation used by the server. The previous nested-HMAC client expression could never authenticate.

The WebSocket server is LAN-capable by default (`0.0.0.0`) and can be restricted with `DRIVEPAD_HOST`. Authentication is still mandatory, and the server rejects additional clients while one session is active. `DRIVEPAD_PORT` can select the listening port.

The server now reports `listening` only after the WebSocket server emits its listening event. Reconnects clear the challenge, authentication state, sequence gate, and watchdog state. The provider remains intentionally unavailable until a verified Windows backend is implemented.
