export type TransportKind = 'wifi' | 'usb' | 'bluetooth';

export interface ConnectionTransport {
  readonly kind: TransportKind;
  readonly connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  onMessage(handler: (data: Uint8Array) => void): () => void;
  onStateChange(handler: (connected: boolean) => void): () => void;
}

export interface PairingSession {
  id: string;
  createdAt: number;
  expiresAt: number;
  code: string;
  pcName: string;
  nonce: string;
}

export type PairingEvent =
  | { type: 'pairing-request'; session: PairingSession }
  | { type: 'pairing-confirmed'; sessionId: string }
  | { type: 'pairing-revoked'; sessionId: string }
  | { type: 'pairing-expired'; sessionId: string };

export function generatePairingSession(pcName: string): PairingSession {
  const now = Date.now();
  const nonce = Math.random().toString(36).slice(2, 10);
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    expiresAt: now + 1000 * 60 * 5,
    code,
    pcName,
    nonce
  };
}

export function isSessionValid(session: PairingSession, now = Date.now()) {
  return now < session.expiresAt;
}
