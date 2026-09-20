# Running the current bridge runtime

The runtime now creates a real, short-lived pairing session and validates the session ID plus pairing code before the WebSocket challenge proof is accepted. The session is revoked when the bridge exits.

Start it with:

```bash
npm install
npm run bridge
```

The console prints the LAN WebSocket URL, session ID, code, and nonce. This is a development pairing path; do not share the code or nonce. The PWA does not yet have a QR scanner or pairing screen wired to this runtime.

The bridge chooses a private IPv4 address automatically. To select a specific adapter, set `DRIVEPAD_HOST` to a private address such as `192.168.1.20`. Do not set it to a public address. Windows Firewall should allow inbound TCP only on the selected private network profile and bridge port, not on public networks.

## What you must do locally

1. Put the phone and PC on the same trusted private Wi-Fi network.
2. Allow Node/DRIVEPAD through Windows Firewall only when prompted for **Private networks**.
3. If no prompt appears, create a narrowly scoped inbound TCP rule for port `17842` on the Private profile.
4. Do not port-forward the bridge from your router.
5. Keep the printed pairing code and nonce private.
6. The current runtime still cannot drive a game: the virtual-controller backend is deliberately disabled.
