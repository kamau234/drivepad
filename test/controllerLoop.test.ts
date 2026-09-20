import { describe, expect, it, vi } from 'vitest';
import { InputEngine } from '../src/input/inputEngine';
import { ControllerLoop } from '../src/input/controllerLoop';

describe('ControllerLoop', () => {
  it('emits states at a bounded rate and stops safely', () => {
    vi.useFakeTimers();
    const engine = new InputEngine();
    const frames: number[] = [];
    const loop = new ControllerLoop(engine, (state) => frames.push(state.sequence), 60);
    engine.setAxis('throttle', 1, 1);
    loop.start();
    vi.advanceTimersByTime(50);
    expect(frames.length).toBeGreaterThanOrEqual(2);
    loop.stop();
    expect(loop.lastState.throttle).toBe(0);
    vi.useRealTimers();
  });
});
