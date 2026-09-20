# Development

## Boundaries

- `src/main.tsx`: composition of the mobile shell only.
- `src/input`: deterministic multi-pointer input state with profile tuning.
- `src/profiles`: persisted profile and layout storage.
- `src/protocol`: versioned, validated wire packets.
- `src/connection`: pairing and transport runtime state.
- `bridge/transport`: Windows connection transports.
- `bridge/virtual-controller`: `VirtualControllerProvider` abstraction and concrete providers.
- `bridge/diagnostics`: packet counters, latency, and provider health.

No game-specific process injection is permitted. The bridge must release every axis/button on heartbeat timeout or disconnect before any controller is exposed as production-ready.

## Quality gates

Every milestone must pass `npm run build`, unit tests for state transitions/protocol validation, and a manual multi-touch acceptance test. Unsupported browser capabilities must be reported honestly and never simulated as connected.

## Local workflow

```bash
npm install
npm run dev
npm run build
npm test
```

## Bridge workflow

```bash
npm run bridge
```

When the provider is unavailable, the bridge must still boot with pairing enabled but keep controller output disabled and report the provider status honestly.
