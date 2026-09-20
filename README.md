# DRIVEPAD

DRIVEPAD is a local-first racing controller: an installable mobile PWA paired with a Windows bridge that exposes a replaceable virtual-controller backend.

## Current milestone

Phase 1–2 establishes the TypeScript/Vite PWA foundation and premium, landscape-first racing cockpit. The cockpit already uses pointer capture and independent pointer events for steering, throttle, brake, nitrous, handbrake, and simultaneous touch input. Connection and bridge functionality is intentionally not represented as complete until implemented and tested.

## Development

```bash
npm install
npm run dev
npm run build
```

## Roadmap

- Input engine and deterministic controller state
- Versioned binary protocol and authenticated pairing
- Windows bridge and watchdog
- Pluggable virtual-controller providers
- Profiles, layout editor, calibration, diagnostics, and installers

See `DEVELOPMENT.md` for architectural boundaries.
