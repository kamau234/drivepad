# HIDMaestro helper boundary

This directory contains the isolated .NET process boundary for the verified HIDMaestro v1.9.0 SDK.

Build it on the verified Windows machine with the SDK DLL path supplied explicitly:

```powershell
dotnet build bridge/virtual-controller/hidmaestro-helper/HidMaestro.Helper.csproj `
  -p:HIDMAESTRO_SDK_DLL='C:\Users\USER\Downloads\HIDMaestro-v1.9.0\HIDMaestroTest\HIDMaestro.Core.dll'
```

The helper owns `HMContext` and the controller. It communicates through newline-delimited JSON over stdin/stdout; stdout is protocol-only and diagnostics should be written to stderr. It loads `xbox-360-wired`, reports `ready` only after `CreateController` succeeds, submits `HMGamepadState`, submits an empty state for release, and disposes the controller on close or EOF.

The Node client is intentionally only an IPC boundary. It does not install drivers, search for DLLs, or claim readiness. The runtime/provider integration is a separate change and is not included yet.

The real Windows smoke test remains separate from the normal unit-test suite.
