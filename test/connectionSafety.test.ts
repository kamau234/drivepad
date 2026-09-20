import { describe, expect, it } from 'vitest';
import { PairingManager } from '../src/connection/pairingManager';
import { PacketGate } from '../bridge/safety/watchdog';
import { neutralControllerState } from '../src/protocol/controller';

describe('PairingManager', () => {
  it('requires the exact code and supports revocation', () => {
    const manager = new PairingManager(1000);
    const session = manager.create('PC', 100);
    expect(() => manager.confirm(session.id, 'WRONG', 'phone')).toThrow();
    manager.confirm(session.id, session.code, 'phone', 200);
    expect(manager.isAuthorized(session.id, 'phone', 300)).toBe(true);
    manager.revoke(session.id);
    expect(manager.isAuthorized(session.id, 'phone', 301)).toBe(false);
  });

  it('expires sessions', () => {
    const manager = new PairingManager(1000);
    const session = manager.create('PC', 100);
    expect(() => manager.confirm(session.id, session.code, 'phone', 1101)).toThrow('expired');
  });
});

describe('PacketGate', () => {
  it('rejects duplicates and out-of-order packets', () => {
    const gate = new PacketGate();
    const packet = (sequence: number) => ({ version: 1, sequence, timestampMs: 1, state: { ...neutralControllerState(), sequence } });
    expect(gate.accept(packet(10))).toBe(true);
    expect(gate.accept(packet(10))).toBe(false);
    expect(gate.accept(packet(9))).toBe(false);
    expect(gate.accept(packet(11))).toBe(true);
  });
});
