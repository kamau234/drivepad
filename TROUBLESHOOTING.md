# Troubleshooting

## The app does not install

Use HTTPS or localhost, confirm the manifest and service worker are reachable, and use a browser with PWA support.

## Controls scroll the page

The racing surface applies `touch-action: none`; reload after updating the service worker and ensure the app is opened in standalone mode.

## Connection status

The current status is deliberately disconnected by default. A connected state will only be enabled by the implemented pairing transport in a later milestone.
