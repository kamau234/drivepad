# Windows packaging scaffold

This directory contains the minimum reproducible packaging scaffold for the verified Windows helper. It is deliberately not an installer and does not install drivers or download binaries.

## Build

Build the PWA and tests from the repository root:

```powershell
npm install
npm run build
npm test
```

Build the self-contained x64 helper:

```powershell
$env:HIDMAESTRO_SDK_ROOT = 'C:\path\to\HIDMaestro-v1.9.0\HIDMaestroTest'
.\packaging\windows\publish-helper.ps1
```

The helper is published under `artifacts\windows\hidmaestro-helper` for:

- target framework: `net10.0-windows10.0.26100.0`
- runtime: `win-x64`
- self-contained execution

The SDK directory must contain the independently verified `HIDMaestro.Core.dll`. The script does not fetch the SDK, install a driver, invoke `HIDMaestroTest.exe emulate`, or include any temporary smoke-test project.

## Runtime prerequisites

The packaged helper does not require the .NET SDK on the target machine because it is self-contained. The bridge host currently runs through the repository's Node/TypeScript runtime (`npm run bridge`), so a deployment host must either provide the supported Node runtime and packaged bridge assets or use a separately produced host executable. This scaffold does not pretend to produce that executable.

The HIDMaestro backend and its driver must be installed and verified separately by an authorized Windows administrator where required. DrivePad does not disable Defender, Secure Boot, or other Windows security features.

## Provider readiness

The bridge may report HIDMaestro ready only after the helper returns the `ready` response from `initialize` and the provider reports `isReady()`. A phone authentication succeeds independently and is not evidence that a controller exists. Any missing SDK, helper failure, provider write failure, watchdog timeout, or disconnect remains fail-closed and releases controller state.

## Start, stop, diagnose, uninstall

Start the bridge using the documented bridge command from a deployment directory. Stop it using the tray Quit action or `Ctrl+C`/normal process termination. The host must release all output, close the helper, and stop the WebSocket server before exiting.

Diagnostics must use the bridge status surface and stderr/log output; never share pairing codes or secrets in support logs. To uninstall, stop the host, remove the staged DrivePad files, and remove any separately installed HIDMaestro backend only through its documented vendor/uninstall procedure. DrivePad does not silently remove or install drivers.

## `joy.cpl` validation

1. Start the host with the verified HIDMaestro backend available.
2. Open **Run** (`Win+R`), enter `joy.cpl`, and press Enter.
3. Confirm `XBOX 360 For Windows` appears.
4. Open **Properties**, then the **Test** tab.
5. Verify steering/analog axes move through the expected ranges.
6. Verify each mapped button registers and releases.
7. Trigger DrivePad `releaseAll`, watchdog timeout, disconnect, and clean shutdown; confirm all controls return neutral.
8. Confirm the device is disposed on shutdown and is recreated correctly after restart.

## Verification boundary

Already independently verified on the development PC: HIDMaestro SDK controller creation, `joy.cpl` enumeration, analog/button output, neutral/release behavior, and the isolated helper boundary.

Still requires deployment validation: staged host execution, tray integration, phone authentication, complete packet application, watchdog/disconnect behavior through the packaged host, controller disposal/restart, and testing in a real compatible racing game.
