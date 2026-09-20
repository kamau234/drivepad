# Windows virtual-controller provider

DRIVEPAD does not bundle or silently install a kernel driver. The provider boundary is ready, but a concrete Windows backend must be selected, legally redistributable, actively maintained, and manually verified on the target Windows version before it is enabled.

## Required provider contract

A concrete provider must implement `VirtualControllerProvider` and must:

- create exactly one controller instance during `initialize()`;
- expose a documented Windows controller type to the operating system;
- apply normalized axes and button state deterministically;
- release all axes and buttons on `releaseAll()`;
- close handles and release the device on `close()`;
- fail closed if initialization or any write operation fails;
- report readiness only after the OS-facing device is actually initialized.

## Do not use as an implementation shortcut

- retired ViGEmBus APIs or abandoned packages;
- game-process injection;
- keyboard emulation presented as a game controller;
- a fake in-memory provider;
- a provider that reports ready before Windows can enumerate the device.

## Verification gate

Before wiring a provider into `bridge/runtime.ts`, verify on the target Windows machine:

1. Windows enumerates the device in **Set up USB game controllers** (`joy.cpl`) or the provider's documented diagnostic tool.
2. Analog axes move through the OS test panel.
3. Buttons register and release.
4. `releaseAll()` leaves every control neutral.
5. Disconnect/watchdog tests release the device.
6. A racing game receives the same values without game-specific injection.

Until all six checks pass, runtime output must remain disabled and the UI must say `Virtual controller backend unavailable`.
