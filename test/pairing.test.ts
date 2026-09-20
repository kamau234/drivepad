import { describe, expect, it } from 'vitest';
import { generatePairingSession, isSessionValid } from '../src/connection/transport';

describe('pairing', () => {
  it('creates a short-lived authenticated local session', () => {
    const session = generatePairingSession('DrivePad-PC');
    expect(session.code.length).toBeGreaterThanOrEqual(4);
    expect(session.id).toBeTruthy();
    expect(isSessionValid(session)).toBe(true);
  });
});
