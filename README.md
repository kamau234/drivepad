# DRIVEPAD

DRIVEPAD is a local-first racing controller: an installable mobile PWA paired with a Windows bridge that exposes a replaceable virtual-controller backend.

## Current milestone

Phase 1-3 establishes the TypeScript/Vite PWA foundation, premium racing cockpit, deterministic multi-pointer input system, and the verified bridge-provider boundary.

The app shell is now a landscape-first racing UI with steering and pedal zones, multi-touch-safe control handling, persisted control profiles, and explicit pairing/connection runtime separation.

## Features

- installable mobile PWA shell
- premium racing cockpit UI
- deterministic multi-pointer input state
- tuning and profile persistence
- verified bridge/provider boundary for Windows backends
- secure pairing and bridge diagnostics runtime model

## Development

```bash
npm install
npm run dev
npm run build
npm test
```

## Bridge runtime

```bash
npm run bridge
```

The Windows bridge is intentionally not a fake controller. It remains an opt-in runtime that only exposes output when a verified provider is available.

## Roadmap

- finalize bridge tray lifecycle and diagnostics UX
- publish packaged Windows bridge and installer flow
- complete E2E connection integration cleanup and validation

See `DEVELOPMENT.md` for architectural boundaries and `INSTALLATION.md` for installation guidance.
