# Installation

## Mobile PWA

Serve the built `dist` directory over HTTPS (or localhost for development), open it in a supported mobile browser, and use the browser's **Install/Add to Home Screen** action. Service-worker caching is included for offline shell availability.

## Windows bridge

The bridge runtime is intentionally opt-in and only exposes virtual-controller output when a verified Windows provider has been selected and initialized.

The runtime will remain in a safe disabled state until a maintained provider, watchdog, pairing verification, and controller test path are validated on Windows.

## Build/install steps

```bash
npm install
npm run build
npm test
```

After a verified Windows provider is available, the bridge can be started with:

```bash
npm run bridge
```
