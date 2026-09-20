import { describe, expect, it } from 'vitest';
import { decodeControllerPacket, encodeControllerPacket, isNewerSequence, neutralControllerState } from '../src/protocol/controller';
import { InputEngine } from '../src/input/inputEngine';

describe('InputEngine', () => {
  it('keeps simultaneous pointer ownership independent', () => {
    const engine = new InputEngine();
    engine.setAxis('steering', 1, -0.8);
    engine.setAxis('throttle', 2, 0.75);
    engine.press('nitrous', 3);
    engine.press('gearUp', 4);
    engine.releasePointer(2);
    const state = engine.snapshot();
    expect(state.steering).toBe(-0.8);
    expect(state.throttle).toBe(0);
    expect(state.nitrous).toBe(true);
    expect(state.gearUp).toBe(true);
  });

  it('releases every control on emergency release', () => {
    const engine = new InputEngine();
    engine.setAxis('throttle', 1, 1);
    engine.press('handbrake', 2);
    engine.releaseAll();
    const state = engine.snapshot();
    expect(state.throttle).toBe(0);
    expect(state.handbrake).toBe(false);
  });
});

describe('controller protocol', () => {
  it('round trips normalized analog and digital state', () => {
    const state = { ...neutralControllerState(1234), sequence: 9, steering: -0.82, throttle: 0.74, brake: 0.2, nitrous: true, gearUp: true };
    const decoded = decodeControllerPacket(encodeControllerPacket(state));
    expect(decoded.sequence).toBe(9);
    expect(decoded.state.steering).toBeCloseTo(-0.82, 3);
    expect(decoded.state.throttle).toBeCloseTo(0.74, 3);
    expect(decoded.state.nitrous).toBe(true);
    expect(decoded.state.gearUp).toBe(true);
  });

  it('rejects malformed and stale packets', () => {
    expect(() => decodeControllerPacket(new Uint8Array(3))).toThrow('Malformed');
    expect(isNewerSequence(11, 10)).toBe(true);
    expect(isNewerSequence(10, 10)).toBe(false);
    expect(isNewerSequence(9, 10)).toBe(false);
  });
});
