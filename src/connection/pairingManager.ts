export type PairingStatus = 'pending' | 'paired' | 'revoked' | 'expired';

const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function secureBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof crypto === 'undefined' || !crypto.getRandomValues) throw new Error('Secure random generator unavailable');
  crypto.getRandomValues(bytes);
  return bytes;
}
function secureToken(length: number) {
  return Array.from(secureBytes(length), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function secureCode(length: number) {
  return Array.from(secureBytes(length), (byte) => alphabet[byte % alphabet.length]).join('');
}

export type PairingSession = {
  id: string;
  createdAt: number;
  expiresAt: number;
  code: string;
  pcName: string;
  nonce: string;
  status: PairingStatus;
  deviceId?: string;
};

export class PairingManager {
  private readonly sessions = new Map<string, PairingSession>();
  constructor(private readonly ttlMs = 5 * 60_000) {}

  create(pcName: string, now = Date.now()): PairingSession {
    const session: PairingSession = {
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : secureToken(16),
      createdAt: now,
      expiresAt: now + this.ttlMs,
      code: secureCode(6),
      pcName,
      nonce: secureToken(16),
      status: 'pending'
    };
    this.sessions.set(session.id, session);
    return { ...session };
  }

  get(id: string, now = Date.now()): PairingSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (session.status === 'pending' && now >= session.expiresAt) session.status = 'expired';
    return { ...session };
  }

  confirm(id: string, code: string, deviceId: string, now = Date.now()): PairingSession {
    const session = this.sessions.get(id);
    if (!session || session.status !== 'pending' || now >= session.expiresAt) {
      if (session) session.status = 'expired';
      throw new Error('Pairing code expired or invalid');
    }
    if (session.code !== code.trim().toUpperCase()) throw new Error('Pairing code does not match');
    session.status = 'paired';
    session.deviceId = deviceId;
    return { ...session };
  }

  revoke(id: string) {
    const session = this.sessions.get(id);
    if (session) session.status = 'revoked';
  }

  isAuthorized(id: string, deviceId: string, now = Date.now()) {
    const session = this.get(id, now);
    return Boolean(session && session.status === 'paired' && session.deviceId === deviceId);
  }
}
