export type BrowserCapabilities = {
  serviceWorker: boolean;
  webBluetooth: boolean;
  wakeLock: boolean;
  pointerEvents: boolean;
};

export function detectBrowserCapabilities(): BrowserCapabilities {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    webBluetooth: 'bluetooth' in navigator,
    wakeLock: 'wakeLock' in navigator,
    pointerEvents: 'PointerEvent' in window
  };
}

export function bluetoothUnavailableMessage(capabilities: BrowserCapabilities) {
  return capabilities.webBluetooth ? null : 'Bluetooth is not supported in this browser. Use Wi-Fi or USB instead.';
}
