import { describe, expect, it, vi } from 'vitest';
import { InputWatchdog, PacketGate } from '../bridge/safety/watchdog';
import { neutralControllerState } from '../src/protocol/controller';

describe('bridge safety integration boundaries', () => {
  it('releases output after a packet timeout', () => {
    vi.useFakeTimers(); const releases: string[] = [];
    const watchdog = new InputWatchdog({ timeoutMs: 250, onRelease: (reason) => releases.push(reason) });
    watchdog.arm(); watchdog.markPacket(); vi.advanceTimersByTime(251);
    expect(releases).toEqual(['timeout']); watchdog.disarm(); vi.useRealTimers();
  });
  it('requires a fresh sequence after gate reset', () => {
    const gate = new PacketGate(); const packet = (sequence: number) => ({ version: 1, sequence, timestampMs: 1, state: { ...neutralControllerState(), sequence } });
    expect(gate.accept(packet(20))).toBe(true); expect(gate.accept(packet(20))).toBe(false); gate.reset(); expect(gate.accept(packet(20))).toBe(true);
  });
});
