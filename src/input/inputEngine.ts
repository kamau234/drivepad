import { ControllerState, neutralControllerState } from '../protocol/controller';

export type AxisName = 'steering' | 'throttle' | 'brake' | 'clutch' | 'handbrakeAxis';
export type ButtonName = 'handbrake' | 'gearUp' | 'gearDown' | 'nitrous' | 'horn' | 'pause';

export type InputTuning = {
  steeringDeadZone: number;
  steeringSensitivity: number;
  steeringSmoothing: number;
  throttleSensitivity: number;
  brakeSensitivity: number;
  autoGas: boolean;
};

export const defaultInputTuning: InputTuning = {
  steeringDeadZone: 0.03,
  steeringSensitivity: 1,
  steeringSmoothing: 0.15,
  throttleSensitivity: 1,
  brakeSensitivity: 1,
  autoGas: false
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

/**
 * Pointer ownership keeps each touch independent. Axis values are reduced
 * deterministically so releasing one pointer cannot cancel another pointer.
 */
export class InputEngine {
  private readonly axes = new Map<AxisName, Map<number, number>>();
  private readonly buttons = new Map<ButtonName, Set<number>>();
  private tuning: InputTuning = { ...defaultInputTuning };
  private sequence = 0;
  private readonly smoothed = new Map<AxisName, number>();

  constructor(tuning: Partial<InputTuning> = {}) {
    (['steering', 'throttle', 'brake', 'clutch', 'handbrakeAxis'] as AxisName[])
      .forEach((axis) => this.axes.set(axis, new Map()));
    (['handbrake', 'gearUp', 'gearDown', 'nitrous', 'horn', 'pause'] as ButtonName[])
      .forEach((button) => this.buttons.set(button, new Set()));
    this.setTuning(tuning);
  }

  setTuning(tuning: Partial<InputTuning>): void {
    this.tuning = {
      ...this.tuning,
      ...tuning,
      steeringDeadZone: clamp(finite(tuning.steeringDeadZone ?? this.tuning.steeringDeadZone), 0, 0.5),
      steeringSensitivity: clamp(finite(tuning.steeringSensitivity ?? this.tuning.steeringSensitivity), 0.1, 3),
      steeringSmoothing: clamp(finite(tuning.steeringSmoothing ?? this.tuning.steeringSmoothing), 0, 0.95),
      throttleSensitivity: clamp(finite(tuning.throttleSensitivity ?? this.tuning.throttleSensitivity), 0.1, 3),
      brakeSensitivity: clamp(finite(tuning.brakeSensitivity ?? this.tuning.brakeSensitivity), 0.1, 3),
      autoGas: Boolean(tuning.autoGas ?? this.tuning.autoGas)
    };
  }

  getTuning(): InputTuning {
    return { ...this.tuning };
  }

  setAxis(axis: AxisName, pointerId: number, value: number): void {
    this.axes.get(axis)?.set(pointerId, finite(value));
  }

  releaseAxis(axis: AxisName, pointerId: number): void {
    this.axes.get(axis)?.delete(pointerId);
  }

  press(button: ButtonName, pointerId: number): void {
    this.buttons.get(button)?.add(pointerId);
  }

  release(button: ButtonName, pointerId: number): void {
    this.buttons.get(button)?.delete(pointerId);
  }

  releasePointer(pointerId: number): void {
    this.axes.forEach((owners) => owners.delete(pointerId));
    this.buttons.forEach((owners) => owners.delete(pointerId));
  }

  releaseAll(): void {
    this.axes.forEach((owners) => owners.clear());
    this.buttons.forEach((owners) => owners.clear());
  }

  snapshot(timestampMs = Date.now()): ControllerState {
    const rawAxis = (name: AxisName): number => {
      const values = [...(this.axes.get(name)?.values() ?? [])];
      if (!values.length) return name === 'throttle' && this.tuning.autoGas ? 1 : 0;
      if (name === 'steering') {
        return values.reduce((selected, value) => Math.abs(value) > Math.abs(selected) ? value : selected, 0);
      }
      return Math.max(...values);
    };

    const axis = (name: AxisName): number => {
      let value = rawAxis(name);
      if (name === 'steering') {
        const deadZone = this.tuning.steeringDeadZone;
        if (Math.abs(value) <= deadZone) value = 0;
        else value = Math.sign(value) * ((Math.abs(value) - deadZone) / (1 - deadZone));
        value = Math.sign(value) * Math.pow(Math.abs(value), 1 / this.tuning.steeringSensitivity);
        const previous = this.smoothed.get(name) ?? value;
        value = previous + (value - previous) * (1 - this.tuning.steeringSmoothing);
        this.smoothed.set(name, value);
      } else if (name === 'throttle') {
        value = Math.pow(clamp(value, 0, 1), 1 / this.tuning.throttleSensitivity);
      } else if (name === 'brake') {
        value = Math.pow(clamp(value, 0, 1), 1 / this.tuning.brakeSensitivity);
      }
      return clamp(value, name === 'steering' ? -1 : 0, 1);
    };

    const button = (name: ButtonName) => Boolean(this.buttons.get(name)?.size);
    return {
      ...neutralControllerState(timestampMs),
      sequence: this.sequence++,
      steering: axis('steering'),
      throttle: axis('throttle'),
      brake: axis('brake'),
      clutch: axis('clutch'),
      handbrakeAxis: axis('handbrakeAxis'),
      handbrake: button('handbrake'),
      gearUp: button('gearUp'),
      gearDown: button('gearDown'),
      nitrous: button('nitrous'),
      horn: button('horn'),
      pause: button('pause')
    };
  }
}
