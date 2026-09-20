import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';

export type BridgePairingSession = { id: string; code: string; nonce: string; createdAt: number; expiresAt: number; revoked: boolean };
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const code = () => Array.from(randomBytes(6), (value) => alphabet[value % alphabet.length]).join('');
const same = (left: string, right: string) => { const a = Buffer.from(left.trim().toUpperCase()); const b = Buffer.from(right.trim().toUpperCase()); return a.length === b.length && timingSafeEqual(a, b); };

export class BridgePairingRegistry {
  private readonly session: BridgePairingSession;
  constructor(private readonly ttlMs = 5 * 60_000) {
    const createdAt = Date.now();
    this.session = { id: randomUUID(), code: code(), nonce: randomBytes(16).toString('hex'), createdAt, expiresAt: createdAt + ttlMs, revoked: false };
  }
  get publicSession() { return { ...this.session }; }
  verify(sessionId: string, suppliedCode: string, now = Date.now()) {
    return sessionId === this.session.id && !this.session.revoked && now < this.session.expiresAt && same(this.session.code, suppliedCode) ? { nonce: this.session.nonce } : undefined;
  }
  revoke() { this.session.revoked = true; }
}
