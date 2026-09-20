export type VirtualControllerState = {
  leftStickX: number;
  leftStickY: number;
  rightTrigger: number;
  leftTrigger: number;
  buttons: ReadonlySet<string>;
};

export interface VirtualControllerProvider {
  readonly id: string;
  readonly displayName: string;
  initialize(): Promise<void>;
  apply(state: VirtualControllerState): Promise<void>;
  releaseAll(): Promise<void>;
  close(): Promise<void>;
  isReady(): boolean;
}

export function mapDrivepadToVirtualController(state: {
  steering: number;
  throttle: number;
  brake: number;
  clutch: number;
  handbrakeAxis: number;
  handbrake: boolean;
  gearUp: boolean;
  gearDown: boolean;
  nitrous: boolean;
  horn: boolean;
  pause: boolean;
}): VirtualControllerState {
  const buttons = new Set<string>();
  if (state.handbrake || state.handbrakeAxis > 0.01) buttons.add('A');
  if (state.gearUp) buttons.add('Y');
  if (state.gearDown) buttons.add('X');
  if (state.nitrous) buttons.add('B');
  if (state.horn) buttons.add('LB');
  if (state.pause) buttons.add('START');
  return { leftStickX: Math.max(-1, Math.min(1, state.steering)), leftStickY: 0, rightTrigger: Math.max(0, Math.min(1, state.throttle)), leftTrigger: Math.max(0, Math.min(1, state.brake)), buttons };
}
