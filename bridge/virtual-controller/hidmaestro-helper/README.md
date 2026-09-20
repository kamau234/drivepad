# DrivePad HIDMaestro Helper

This is an isolated .NET helper process for the verified HIDMaestro v1.9.0 SDK.

It does not modify the DrivePad runtime or provider abstractions.

## Verified SDK

The project references:

```text
C:\Users\USER\Downloads\HIDMaestro-v1.9.0\HIDMaestroTest\HIDMaestro.Core.dll
```

Target framework:

```text
net10.0-windows10.0.26100.0
```

The helper deliberately does **not** call:

```csharp
ctx.InstallDriver();
```

The HIDMaestro driver is expected to have been installed and verified separately.

## Build

From the repository root:

```bat
dotnet build bridge\virtual-controller\hidmaestro-helper\HidMaestro.Helper.csproj -c Release
```

The output DLL is expected at:

```text
bridge\virtual-controller\hidmaestro-helper\bin\Release\net10.0-windows10.0.26100.0\win-x64\HidMaestro.Helper.dll
```

## IPC protocol

Communication uses newline-delimited JSON over stdin/stdout.

Stdout is protocol-only. Diagnostics, if added later, must use stderr.

### Initialize

Request:

```json
{"id":1,"type":"initialize","profile":"xbox-360-wired"}
```

Successful response:

```json
{"id":1,"type":"ready","provider":"hidmaestro","profile":"xbox-360-wired"}
```

### Apply state

Request:

```json
{
  "id": 2,
  "type": "apply",
  "state": {
    "leftStickX": 0.25,
    "leftStickY": 0,
    "rightTrigger": 1,
    "leftTrigger": 0,
    "buttons": ["A"]
  }
}
```

Successful response:

```json
{"id":2,"type":"ok","operation":"apply"}
```

### Release all

Request:

```json
{"id":3,"type":"releaseAll"}
```

The helper submits:

```csharp
controller.SubmitState(new HMGamepadState());
```

Successful response:

```json
{"id":3,"type":"ok","operation":"releaseAll"}
```

### Close

Request:

```json
{"id":4,"type":"close"}
```

The helper:

1. submits neutral state;
2. disposes the HIDMaestro controller;
3. returns an acknowledgement;
4. exits.

Successful response:

```json
{"id":4,"type":"ok","operation":"close"}
```

EOF also submits neutral state and disposes the controller.

## Fail-closed behavior

The helper reports an error if:

- the profile is not `xbox-360-wired`;
- the profile cannot be loaded;
- controller creation fails;
- a state has invalid fields;
- a button name is unsupported;
- an operation is requested before initialization.

The helper never creates a mock controller and never falls back to keyboard or mouse emulation.

This helper is not yet connected to `runtime.ts`, `providerFactory.ts`, or `websocketServer.ts`. That integration is a separate change.
