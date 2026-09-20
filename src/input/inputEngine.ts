import { ControllerState, neutralControllerState } from '../protocol/controller';

type AxisName = 'steering' | 'throttle' | 'brake' | 'clutch' | 'handbrakeAxis';
type ButtonName = 'handbrake' | 'gearUp' | 'gearDown' | 'nitrous' | 'horn' | 'pause';

/** Pointer ownership keeps each touch independent; releasing one pointer cannot cancel another. */
export class InputEngine {
  private readonly axes = new Map<AxisName, Map<number, number>>();
  private readonly buttons = new Map<ButtonName, Set<number>>();
  private sequence = 0;

  constructor() {
    (['steering', 'throttle', 'brake', 'clutch', 'handbrakeAxis'] as AxisName[]).forEach((axis) => this.axes.set(axis, new Map()));
    (['handbrake', 'gearUp', 'gearDown', 'nitrous', 'horn', 'pause'] as ButtonName[]).forEach((button) => this.buttons.set(button, new Set()));
  }

  setAxis(axis: AxisName, pointerId: number, value: number) { this.axes.get(axis)?.set(pointerId, value); }
  releaseAxis(axis: AxisName, pointerId: number) { this.axes.get(axis)?.delete(pointerId); }
  press(button: ButtonName, pointerId: number) { this.buttons.get(button)?.add(pointerId); }
  release(button: ButtonName, pointerId: number) { this.buttons.get(button)?.delete(pointerId); }
  releasePointer(pointerId: number) { this.axes.forEach((owners) => owners.delete(pointerId)); this.buttons.forEach((owners) => owners.delete(pointerId)); }
  releaseAll() { this.axes.forEach((owners) => owners.clear()); this.buttons.forEach((owners) => owners.clear()); }

  snapshot(timestampMs = Date.now()): ControllerState {
    const axis = (name: AxisName) => {
      const values = [...(this.axes.get(name)?.values() || [])];
      return values.length ? values[values.length - 1] : 0;
    };
    const button = (name: ButtonName) => Boolean(this.buttons.get(name)?.size);
    return { ...neutralControllerState(timestampMs), sequence: this.sequence++, steering: axis('steering'), throttle: axis('throttle'), brake: axis('brake'), clutch: axis('clutch'), handbrakeAxis: axis('handbrakeAxis'), handbrake: button('handbrake'), gearUp: button('gearUp'), gearDown: button('gearDown'), nitrous: button('nitrous'), horn: button('horn'), pause: button('pause') };
  }
}
