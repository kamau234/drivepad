import { ControllerState, neutralControllerState } from '../protocol/controller';
import { InputEngine } from './inputEngine';

export type ControllerFrame = (state: ControllerState) => void;

/** Runs input sampling independently of React rendering in both browsers and tests. */
export class ControllerLoop {
  private timer: ReturnType<typeof setInterval> | undefined;
  private sequenceState = neutralControllerState();

  constructor(private readonly engine: InputEngine, private readonly onFrame: ControllerFrame, private readonly hz = 60) {}

  start() {
    if (this.timer !== undefined) return;
    const interval = Math.max(8, 1000 / this.hz);
    this.timer = setInterval(() => {
      const now = typeof performance !== 'undefined' ? performance.timeOrigin + performance.now() : Date.now();
      this.sequenceState = this.engine.snapshot(now);
      this.onFrame(this.sequenceState);
    }, interval);
  }

  stop() {
    if (this.timer === undefined) return;
    clearInterval(this.timer);
    this.timer = undefined;
    this.engine.releaseAll();
    this.sequenceState = this.engine.snapshot();
    this.onFrame(this.sequenceState);
  }

  get lastState() { return this.sequenceState; }
}
