import { describe, expect, it } from 'vitest';
import { mapDrivepadToVirtualController } from '../bridge/virtual-controller/provider';

describe('virtual-controller mapping', () => {
  it('maps normalized racing state without exceeding controller ranges', () => {
    const mapped = mapDrivepadToVirtualController({ steering: 2, throttle: -1, brake: 0.5, clutch: 0, handbrakeAxis: 0, handbrake: false, gearUp: true, gearDown: false, nitrous: true, horn: false, pause: false });
    expect(mapped.leftStickX).toBe(1);
    expect(mapped.rightTrigger).toBe(0);
    expect(mapped.leftTrigger).toBe(0.5);
    expect(mapped.buttons).toEqual(new Set(['Y', 'B']));
  });
});
