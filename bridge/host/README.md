# Windows host lifecycle

`BridgeHostLifecycle` supervises the bridge process without becoming a controller provider.

Shutdown is deliberately ordered:

1. stop accepting controller input by closing the bridge server;
2. let the server disconnect the phone, disarm the watchdog, and release outputs;
3. close the `BridgeOutput`, which closes the provider/helper;
4. hide the tray state and optionally terminate the host process.

The lifecycle is idempotent: repeated quit, signal, or shutdown calls share one promise and cannot close the helper twice.

The current tray implementation is a platform-neutral lifecycle boundary. A native Windows tray adapter can own the actual notification-area icon later by calling `start()`, `shutdown()`, and `getStatus()`; it must not apply controller state or replace `BridgeOutput`.
