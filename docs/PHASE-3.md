# Phase 3 — Input and protocol milestone

This milestone adds the production boundaries needed before networking:

- `InputEngine` owns pointer IDs independently and supports emergency release.
- The controller protocol is versioned, fixed-size, little-endian, and validates packet length/version.
- Sequence numbers support duplicate and out-of-order rejection.
- Normalized analog ranges are clamped defensively before encoding.

Run:

```bash
npm install
npm test
npm run build
```

The current visual shell still uses local component state. The next integration step will route its pointer handlers through `InputEngine` and schedule protocol packets without putting high-frequency input into React render state.
