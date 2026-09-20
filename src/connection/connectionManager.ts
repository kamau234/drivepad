import { PairingManager, PairingSession } from './pairingManager';
import { generatePairingSession, type ConnectionTransport, type TransportKind } from './transport';
import { WifiTransport, type WifiPairingDetails } from './wifiTransport';

export type ConnectionMode = TransportKind;

export type ConnectionRuntimeState = {
  mode: ConnectionMode;
  connected: boolean;
  status: 'idle' | 'pairing' | 'connecting' | 'authenticated' | 'error';
  session?: PairingSession;
  message?: string;
};

export class ConnectionManager {
  private readonly pairing = new PairingManager();
  private transport: ConnectionTransport | null = null;
  private state: ConnectionRuntimeState = {
    mode: 'wifi',
    connected: false,
    status: 'idle'
  };

  get current() {
    return { ...this.state };
  }

  get connected() {
    return Boolean(this.transport?.connected ?? this.state.connected);
  }

  supportsBluetooth(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  supportsUsb(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  supportsWifi(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  createPairingSession(pcName: string = 'DRIVEPAD-PC'): PairingSession {
    const session = this.pairing.create(pcName);
    this.state = {
      ...this.state,
      mode: 'wifi',
      connected: false,
      status: 'pairing',
      session,
      message: 'Ready to pair'
    };
    return session;
  }

  async connectWifi(details: WifiPairingDetails): Promise<WifiTransport> {
    const transport = new WifiTransport(details);
    this.transport = transport;
    this.state = {
      ...this.state,
      mode: 'wifi',
      connected: false,
      status: 'connecting',
      message: 'Connecting to DRIVEPAD bridge'
    };

    transport.onStatus((status) => {
      this.state = {
        ...this.state,
        connected: status === 'connected',
        status: status === 'connected' ? 'authenticated' : status === 'error' ? 'error' : 'connecting',
        message: status === 'connected' ? 'Connected to Windows bridge' : status === 'error' ? 'Connection failed' : 'Authenticating'
      };
    });

    await transport.connect();
    this.state = {
      ...this.state,
      connected: true,
      status: 'authenticated',
      message: 'CONNECTED TO WINDOWS'
    };
    return transport;
  }

  async disconnect(): Promise<void> {
    if (!this.transport) {
      this.state = {
        ...this.state,
        connected: false,
        status: 'idle',
        message: 'Disconnected'
      };
      return;
    }

    this.transport.disconnect();
    this.transport = null;
    this.state = {
      ...this.state,
      connected: false,
      status: 'idle',
      message: 'Disconnected'
    };
  }

  async connectByMode(mode: ConnectionMode, details?: { url?: string; sessionId?: string; code?: string; nonce?: string }): Promise<ConnectionTransport | null> {
    switch (mode) {
      case 'wifi':
        if (!details?.url || !details.sessionId || !details.code || !details.nonce) {
          throw new Error('Wi-Fi connection requires session metadata from the bridge.');
        }
        return await this.connectWifi({
          url: details.url,
          sessionId: details.sessionId,
          code: details.code,
          nonce: details.nonce
        });
      case 'usb':
        throw new Error('USB transport is not available in this browser build. Use Wi-Fi or Bluetooth where supported.');
      case 'bluetooth':
        if (!this.supportsBluetooth()) {
          throw new Error('Bluetooth is not supported in this browser. Use Wi-Fi or USB instead.');
        }
        throw new Error('Bluetooth transport is not enabled in this build yet.');
      default:
        throw new Error(`Unsupported transport mode: ${String(mode)}`);
    }
  }

  static describeCapability(mode: ConnectionMode): string {
    switch (mode) {
      case 'wifi':
        return 'WebSocket over local network';
      case 'usb':
        return 'USB tethering or browser-supported USB path';
      case 'bluetooth':
        return 'Web Bluetooth pairing when supported';
      default:
        return 'Not available';
    }
  }
}

export const defaultConnectionManager = new ConnectionManager();
