import { WebSocket } from 'ws';
import { ControllerState, encodeControllerPacket } from '../../src/protocol/controller';
import { createHandshakeProof } from '../security/handshake';

export class WifiBridgeClient {
  private socket?: WebSocket;
  private authenticated = false;
  constructor(private readonly url: string, private readonly sessionId: string, private readonly code: string, private readonly nonce: string) {}
  connect() {
    return new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(this.url);
      this.socket.once('error', reject);
      this.socket.on('message', (raw) => {
        const message = JSON.parse(raw.toString()) as { type: string; challenge?: string };
        if (message.type === 'challenge' && message.challenge) this.socket?.send(JSON.stringify({ type: 'authenticate', sessionId: this.sessionId, code: this.code, proof: createHandshakeProof(createHandshakeProof(this.code, this.nonce), message.challenge) }));
        if (message.type === 'authenticated') { this.authenticated = true; resolve(); }
      });
    });
  }
  send(state: ControllerState) {
    if (!this.authenticated || !this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('Bridge is not authenticated');
    const payload = Buffer.from(encodeControllerPacket(state)).toString('base64');
    this.socket.send(JSON.stringify({ type: 'state', payload }));
  }
  close() { this.authenticated = false; this.socket?.close(); }
}
