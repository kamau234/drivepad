import { WebSocket } from 'ws';
import { ControllerState, encodeControllerPacket } from '../../src/protocol/controller';
import { createHandshakeProof, derivePairingKey } from '../security/handshake';

export class WifiBridgeClient {
  private socket?: WebSocket;
  private authenticated = false;
  constructor(private readonly url: string, private readonly sessionId: string, private readonly code: string, private readonly nonce: string) {}
  connect() {
    return new Promise<void>((resolve, reject) => {
      this.socket = new WebSocket(this.url);
      const fail = (error: Error) => { this.authenticated = false; reject(error); };
      this.socket.once('error', fail);
      this.socket.on('message', (raw) => {
        try {
          const message = JSON.parse(raw.toString()) as { type: string; challenge?: string };
          if (message.type === 'challenge' && message.challenge) {
            const key = derivePairingKey(this.code, this.nonce);
            this.socket?.send(JSON.stringify({ type: 'authenticate', sessionId: this.sessionId, code: this.code, proof: createHandshakeProof(key, message.challenge) }));
          }
          if (message.type === 'authenticated') { this.authenticated = true; resolve(); }
        } catch (error) { fail(error instanceof Error ? error : new Error('Invalid bridge response')); }
      });
      this.socket.once('close', () => { this.authenticated = false; });
    });
  }
  send(state: ControllerState) {
    if (!this.authenticated || !this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('Bridge is not authenticated');
    const payload = Buffer.from(encodeControllerPacket(state)).toString('base64');
    this.socket.send(JSON.stringify({ type: 'state', payload }));
  }
  close() { this.authenticated = false; this.socket?.close(); }
}
