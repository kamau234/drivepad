import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export function derivePairingKey(code: string, nonce: string) {
  return createHash('sha256').update(`${code.trim().toUpperCase()}:${nonce}`).digest('hex');
}

export function createHandshakeProof(key: string, challenge: string) {
  return createHmac('sha256', key).update(challenge).digest('hex');
}

export function verifyHandshakeProof(key: string, challenge: string, proof: string) {
  const expected = Buffer.from(createHandshakeProof(key, challenge), 'utf8');
  const actual = Buffer.from(proof, 'utf8');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createChallenge() { return randomBytes(24).toString('hex'); }
