import { WebSocketServer, WebSocket } from 'ws';
import { createChallenge, derivePairingKey, verifyHandshakeProof } from '../security/handshake';
import { decodeControllerPacket } from '../../src/protocol/controller';
import { InputWatchdog, PacketGate, BridgeOutput } from '../safety/watchdog';

export type BridgeDiagnostics = {
  listening: boolean;
  host: string;
  port: number;
  connected: boolean;
  authenticated: boolean;
  packetsReceived: number;
  rejectedPackets: number;
  lastPacketAt: number | null;
  lastSequence: number | null;
  watchdog: 'armed' | 'released' | 'disarmed';
  provider: string;
};

type PairingVerifier = (sessionId: string, code: string) => { nonce: string; deviceId?: string } | undefined;

export type BridgeServerOptions = {
  host?: string;
  port?: number;
  watchdogTimeoutMs?: number;
};

/** LAN-bound WebSocket bridge. Authentication remains mandatory before state packets are accepted. */
export class DrivepadBridgeServer {
  private readonly server: WebSocketServer;
  private socket: WebSocket | undefined;
  private authenticated = false;
  private challenge: string | undefined;
  private readonly gate = new PacketGate();
  private readonly watchdog: InputWatchdog;
  private diagnostics: BridgeDiagnostics;

  constructor(private readonly output: BridgeOutput, private readonly verifyPairing: PairingVerifier, options: BridgeServerOptions = {}) {
    const host = options.host ?? process.env.DRIVEPAD_HOST ?? '0.0.0.0';
    const port = options.port ?? Number(process.env.DRIVEPAD_PORT ?? 17842);
    this.server = new WebSocketServer({ host, port });
    this.diagnostics = { listening: false, host, port, connected: false, authenticated: false, packetsReceived: 0, rejectedPackets: 0, lastPacketAt: null, lastSequence: null, watchdog: 'disarmed', provider: 'uninitialized' };
    this.watchdog = new InputWatchdog({ timeoutMs: options.watchdogTimeoutMs ?? 250, onRelease: () => { this.diagnostics.watchdog = 'released'; void this.output.releaseAll(); } });
    this.server.on('listening', () => { this.diagnostics.listening = true; });
    this.server.on('connection', (socket) => this.accept(socket));
    this.server.on('error', () => { this.diagnostics.listening = false; });
  }

  getDiagnostics() { return { ...this.diagnostics }; }

  private accept(socket: WebSocket) {
    if (this.socket) { socket.close(1013, 'Another phone is connected'); return; }
    this.socket = socket;
    this.diagnostics.connected = true;
    this.challenge = createChallenge();
    socket.send(JSON.stringify({ type: 'challenge', protocol: 1, challenge: this.challenge }));
    socket.on('message', (raw) => void this.message(raw.toString()));
    socket.on('close', () => this.disconnect());
    socket.on('error', () => this.disconnect());
  }

  private async message(raw: string) {
    let message: Record<string, unknown>;
    try { message = JSON.parse(raw); } catch { this.diagnostics.rejectedPackets++; return; }
    if (!this.authenticated) {
      if (message.type !== 'authenticate' || typeof message.sessionId !== 'string' || typeof message.code !== 'string' || typeof message.proof !== 'string' || !this.challenge) return this.close('Authentication required');
      const pairing = this.verifyPairing(message.sessionId, message.code);
      if (!pairing) return this.close('Pairing rejected');
      const key = derivePairingKey(message.code, pairing.nonce);
      if (!verifyHandshakeProof(key, this.challenge, message.proof)) return this.close('Authentication failed');
      this.authenticated = true; this.diagnostics.authenticated = true; this.gate.reset(); this.watchdog.arm(); this.diagnostics.watchdog = 'armed';
      this.socket?.send(JSON.stringify({ type: 'authenticated', protocol: 1 }));
      return;
    }
    if (message.type !== 'state' || typeof message.payload !== 'string') return;
    try {
      const binary = Buffer.from(message.payload, 'base64');
      const packet = decodeControllerPacket(binary);
      if (!this.gate.accept(packet)) { this.diagnostics.rejectedPackets++; return; }
      this.diagnostics.packetsReceived++; this.diagnostics.lastPacketAt = Date.now(); this.diagnostics.lastSequence = packet.sequence; this.watchdog.markPacket();
      await this.output.apply(packet.state);
    } catch { this.diagnostics.rejectedPackets++; }
  }

  private close(reason: string) { this.socket?.close(1008, reason); this.disconnect(); }
  private disconnect() { if (!this.socket && !this.authenticated) return; this.socket = undefined; this.authenticated = false; this.challenge = undefined; this.diagnostics.connected = false; this.diagnostics.authenticated = false; this.gate.reset(); this.watchdog.disconnect(); }
  async closeServer() { this.disconnect(); this.watchdog.disarm(); await this.output.releaseAll(); await new Promise<void>((resolve) => this.server.close(() => resolve())); this.diagnostics.listening = false; }
}
