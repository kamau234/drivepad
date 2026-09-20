import { ControllerPacket, ControllerState, isNewerSequence, neutralControllerState } from '../../src/protocol/controller';

export type WatchdogOptions = {
  timeoutMs?: number;
  onRelease: (reason: 'timeout' | 'disconnect' | 'emergency') => void;
};

export class PacketGate {
  private lastSequence: number | undefined;
  accept(packet: ControllerPacket) {
    if (this.lastSequence !== undefined && !isNewerSequence(packet.sequence, this.lastSequence)) return false;
    this.lastSequence = packet.sequence;
    return true;
  }
  reset() { this.lastSequence = undefined; }
}

export class InputWatchdog {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private active = false;
  private armed = false;
  private readonly timeoutMs: number;
  private readonly onRelease: WatchdogOptions['onRelease'];

  constructor(options: WatchdogOptions) {
    this.timeoutMs = options.timeoutMs ?? 250;
    this.onRelease = options.onRelease;
  }
  arm() { this.armed = true; this.refresh(); }
  disarm() { this.armed = false; this.active = false; this.clearTimer(); }
  markPacket() { if (!this.armed) return; this.active = true; this.refresh(); }
  disconnect() { this.active = false; this.clearTimer(); this.onRelease('disconnect'); }
  emergencyRelease() { this.active = false; this.clearTimer(); this.onRelease('emergency'); }
  private refresh() {
    this.clearTimer();
    this.timer = setTimeout(() => { this.timer = undefined; if (this.armed && this.active) { this.active = false; this.onRelease('timeout'); } }, this.timeoutMs);
  }
  private clearTimer() { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
}

export type BridgeOutput = {
  apply(state: ControllerState): Promise<void>;
  releaseAll(): Promise<void>;
  close(): Promise<void>;
};

export function neutralOutput(): ControllerState { return neutralControllerState(); }
