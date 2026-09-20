import { describe, expect, it } from 'vitest';
import { actionableError, copyBridgeStatus, createBridgeStatus } from '../bridge/diagnostics/status';

describe('bridge diagnostics status', () => {
  it('keeps provider readiness distinct from phone authentication', () => {
    const status = createBridgeStatus({
      host: 'running',
      provider: {
        id: 'hidmaestro',
        displayName: 'HIDMaestro Xbox 360 Wired',
        discovered: true,
        initialized: true,
        ready: true,
        controllerDeviceCreated: true
      }
    });

    status.phoneSession = 'authenticated';
    expect(status.phoneSession).toBe('authenticated');
    expect(status.provider.ready).toBe(true);
    expect(status.provider.controllerDeviceCreated).toBe(true);
    expect(status.watchdog).toBe('disarmed');
    expect(status.lastAppliedSequence).toBeNull();
  });

  it('copies status without exposing mutable provider state', () => {
    const original = createBridgeStatus();
    const copy = copyBridgeStatus(original);
    copy.provider.ready = true;
    expect(original.provider.ready).toBe(false);
  });

  it('normalizes actionable failure messages', () => {
    expect(actionableError(new Error('provider initialization failed'))).toBe('provider initialization failed');
    expect(actionableError('')).toBe('Bridge operation failed');
  });
});
