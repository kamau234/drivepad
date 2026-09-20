# Installation

## Mobile PWA

Serve the built `dist` directory over HTTPS (or localhost for development), open it in a supported mobile browser, and use the browser's **Install/Add to Home Screen** action. Service-worker caching is enabled for the offline shell.

## Windows bridge

The Windows bridge remains intentionally opt-in and fail-closed. It does not expose virtual-controller output until a verified Windows controller backend is selected, initialized, and confirmed ready.

The runtime stays in a safe disabled state until the provider, watchdog, pairing verification, and controller test path are validated on Windows. DrivePad does not silently install drivers or download executables from arbitrary URLs.

## Required prerequisites

- Node.js and npm installed for the web app build/test step.
- A verified HIDMaestro SDK installation that contains `HIDMaestro.Core.dll`.
- Windows host machine with the HIDMaestro backend already installed and verified by a trusted administrator.
- Administrator privileges only for the Windows backend installation, driver setup, and any required device/driver verification steps.
- The normal DrivePad runtime does not require disabling Defender, Secure Boot, or Windows security features.

## Build and package steps

From the repository root:

```bash
npm install
npm run build
npm test
```

To build the packaged HIDMaestro helper for the verified Windows backend:

```powershell
$env:HIDMAESTRO_SDK_ROOT = "C:\Users\USER\Downloads\HIDMaestro-v1.9.0\HIDMaestroTest"
npm run package:windows-helper
```

This produces a self-contained helper under:

```text
artifacts\windows\hidmaestro-helper
```

The helper is built for:

- target framework: `net10.0-windows10.0.26100.0`
- runtime: `win-x64`
- self-contained execution

The script validates that the SDK directory contains `HIDMaestro.Core.dll` and does not fetch or install any runtime or driver from the internet.

## Provider readiness and failure-closed behavior

The bridge may only report HIDMaestro ready after:

1. the helper process starts successfully,
2. the helper returns a `ready` response from `initialize`, and
3. the provider reports itself `isReady()`.

A paired phone session is not sufficient evidence of controller readiness. The bridge remains fail-closed if:

- the SDK is missing,
- the helper does not initialize,
- the provider initialization fails,
- a write operation fails,
- the watchdog times out,
- the connection disconnects,
- the controller device is missing or not created.

When any of those fail, DrivePad releases controller state and does not keep reporting an active virtual controller.

## Windows validation procedure (`joy.cpl`)

Use the verified backend before trusting controller output.

1. Start the DrivePad bridge with the verified HIDMaestro backend available.
2. Press `Win+R`, type `joy.cpl`, and press Enter.
3. Confirm the Windows device appears as `XBOX 360 For Windows` or the documented HIDMaestro device name.
4. Open the device **Properties** and then the **Test** tab.
5. Verify analog axes respond to steering, throttle, and brake input.
6. Verify each mapped button registers and releases correctly.
7. Trigger `releaseAll`, watchdog timeout, and disconnect paths and confirm all axes/buttons return neutral.
8. Restart the host and confirm the device is recreated cleanly without stale state.

## Start, stop, diagnose, and uninstall

Start the bridge from the deployment directory with the repository's documented bridge command:

```bash
npm run bridge
```

Stop the host using the tray Quit action or the usual process termination path. The shutdown order must release all controller output, close the helper, and stop the server before exit completes.

Diagnostics should use the bridge status surface and stderr/log output only. Do not include pairing codes, secrets, or private challenge values in support logs.

To uninstall:

1. stop the host,
2. remove the staged DrivePad files,
3. remove the HIDMaestro backend only through the backend vendor's documented uninstall procedure,
4. leave Windows Defender, Secure Boot, and OS security protections enabled.

## Verified versus still pending deployment testing

Verified on the development machine:

- TypeScript test suite passes.
- Vite production build passes.
- HIDMaestro helper publishes successfully for `net10.0-windows10.0.26100.0` and `win-x64`.
- The helper binary and `HIDMaestro.Core.dll` are present in the packaged output.

Still requires deployment validation on a real Windows host:

- tray lifecycle integration,
- phone authentication flow,
- packet application through the host bridge,
- watchdog timeout and disconnect release behavior,
- `joy.cpl` controller enumeration and signal path,
- real game validation with the packaged host.

Until that end-to-end validation is complete, the project should be treated as packaging-ready for the helper but not as fully runtime-validated for production use.
