import { describe, expect, it } from 'vitest';
import { InputEngine } from '../src/input/inputEngine';

describe('InputEngine multi-touch ownership', () => {
  it('keeps independent steering, throttle, nitrous, and gear inputs active', () => {
    const engine = new InputEngine();
    engine.setAxis('steering', 1, -0.7);
    engine.setAxis('throttle', 2, 0.8);
    engine.press('nitrous', 3);
    engine.press('gearUp', 4);

    const state = engine.snapshot(100);
    expect(state.steering).toBeLessThan(-0.5);
    expect(state.throttle).toBeGreaterThan(0.7);
    expect(state.nitrous).toBe(true);
    expect(state.gearUp).toBe(true);

    engine.releasePointer(3);
    const next = engine.snapshot(116);
    expect(next.steering).toBeLessThan(-0.5);
    expect(next.throttle).toBeGreaterThan(0.7);
    expect(next.gearUp).toBe(true);
    expect(next.nitrous).toBe(false);
  });

  it('supports profile tuning without changing pointer ownership', () => {
    const engine = new InputEngine({ autoGas: true, steeringDeadZone: 0 });
    expect(engine.snapshot(100).throttle).toBe(1);
    engine.setAxis('brake', 5, 0.5);
    expect(engine.snapshot(116).brake).toBeCloseTo(0.5);
  });
});
