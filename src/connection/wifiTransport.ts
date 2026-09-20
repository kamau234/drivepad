import { ControllerState, encodeControllerPacket } from '../protocol/controller';

export type WifiConnectionStatus = 'disconnected' | 'connecting' | 'authenticating' | 'connected' | 'error';
export type WifiPairingDetails = { url: string; sessionId: string; code: string; nonce: string };

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value.trim().toUpperCase()));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
async function proof(keyHex: string, challenge: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(challenge));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export class WifiTransport {
  private socket?: WebSocket;
  private status: WifiConnectionStatus = 'disconnected';
  private authenticated = false;
  private readonly listeners = new Set<(status: WifiConnectionStatus) => void>();
  constructor(private readonly pairing: WifiPairingDetails) {}
  get connectionStatus() { return this.status; }
  onStatus(listener: (status: WifiConnectionStatus) => void) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private setStatus(status: WifiConnectionStatus) { this.status = status; this.listeners.forEach((listener) => listener(status)); }
  connect() {
    if (this.socket) return Promise.reject(new Error('Wi-Fi transport is already active'));
    this.setStatus('connecting');
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.pairing.url); this.socket = socket;
      const fail = (error: Error) => { this.authenticated = false; this.socket = undefined; this.setStatus('error'); reject(error); };
      socket.onerror = () => fail(new Error('PC not found on local network.'));
      socket.onclose = () => { this.authenticated = false; this.socket = undefined; if (this.status !== 'error') this.setStatus('disconnected'); };
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(String(event.data)) as { type: string; challenge?: string };
          if (message.type === 'challenge' && message.challenge) {
            this.setStatus('authenticating');
            const key = await sha256(`${this.pairing.code}:${this.pairing.nonce}`);
            socket.send(JSON.stringify({ type: 'authenticate', sessionId: this.pairing.sessionId, code: this.pairing.code, proof: await proof(key, message.challenge) }));
          } else if (message.type === 'authenticated') { this.authenticated = true; this.setStatus('connected'); resolve(); }
        } catch { fail(new Error('Invalid response from DRIVEPAD Bridge.')); }
      };
    });
  }
  send(state: ControllerState) {
    if (!this.authenticated || !this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('DRIVEPAD Bridge is not connected.');
    this.socket.send(JSON.stringify({ type: 'state', payload: btoa(String.fromCharCode(...encodeControllerPacket(state))) }));
  }
  disconnect() { this.authenticated = false; this.socket?.close(); this.socket = undefined; this.setStatus('disconnected'); }
}
