import { describe, expect, it } from 'vitest';
import { createHandshakeProof, derivePairingKey, verifyHandshakeProof } from '../bridge/security/handshake';

describe('bridge handshake', () => {
  it('uses the same pairing-key derivation on both sides', () => {
    const key = derivePairingKey('ab12cd', 'nonce-123');
    const proof = createHandshakeProof(key, 'challenge-456');
    expect(verifyHandshakeProof(key, 'challenge-456', proof)).toBe(true);
    expect(verifyHandshakeProof(derivePairingKey('wrong', 'nonce-123'), 'challenge-456', proof)).toBe(false);
  });
});
