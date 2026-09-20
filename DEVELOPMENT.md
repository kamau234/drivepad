# Development

## Boundaries

- `src/main.tsx`: composition of the mobile shell only.
- `src/input`: deterministic multi-pointer input state (next milestone).
- `src/protocol`: versioned, validated wire packets (next milestone).
- `bridge/transport`: Windows connection transports.
- `bridge/virtual-controller`: `VirtualControllerProvider` abstraction and concrete providers.

No game-specific process injection is permitted. The bridge must release every axis/button on heartbeat timeout or disconnect before any controller is exposed as production-ready.

## Quality gates

Every milestone must pass `npm run build`, unit tests for state transitions/protocol validation, and a manual multi-touch acceptance test. Unsupported browser capabilities must be reported honestly rather than represented by fake connection states.
