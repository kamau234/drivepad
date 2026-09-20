import { describe, expect, it, vi } from 'vitest';
import { BridgeHostLifecycle } from '../bridge/host/lifecycle';
import type { BridgeOutput } from '../bridge/safety/watchdog';

function fixture() {
  const calls: string[] = [];
  const output: BridgeOutput = {
    apply: vi.fn(async () => undefined),
    releaseAll: vi.fn(async () => { calls.push('release'); }),
    close: vi.fn(async () => { calls.push('close'); })
  };
  const server = {
    closeServer: vi.fn(async () => { calls.push('server'); })
  };
  const tray = {
    isVisible: false,
    show() { this.isVisible = true; return true; },
    hide() { this.isVisible = false; return false; },
    toggle() { this.isVisible = !this.isVisible; return this.isVisible; },
    getState() { return { visible: this.isVisible }; }
  };
  return { calls, output, server, tray };
}

describe('BridgeHostLifecycle', () => {
  it('transitions to ready only when the provider is reported ready', () => {
    const ready = fixture();
    const host = new BridgeHostLifecycle({ server: ready.server, output: ready.output, tray: ready.tray, providerReady: true });
    host.start();
    expect(host.getStatus()).toBe('hidmaestro-ready');
    expect(host.isAcceptingInput()).toBe(true);

    const unavailable = fixture();
    const disabled = new BridgeHostLifecycle({ server: unavailable.server, output: unavailable.output, tray: unavailable.tray });
    disabled.start();
    expect(disabled.getStatus()).toBe('running-no-provider');
  });

  it('shuts down in order and is idempotent', async () => {
    const value = fixture();
    const host = new BridgeHostLifecycle({ server: value.server, output: value.output, tray: value.tray });
    host.start();

    await Promise.all([host.shutdown(), host.shutdown(), host.shutdown()]);

    expect(value.calls).toEqual(['server', 'close']);
    expect(value.server.closeServer).toHaveBeenCalledTimes(1);
    expect(value.output.close).toHaveBeenCalledTimes(1);
    expect(host.getStatus()).toBe('stopped');
    expect(host.isAcceptingInput()).toBe(false);
    expect(value.tray.isVisible).toBe(false);
  });

  it('reports shutdown failure and never claims to remain ready', async () => {
    const value = fixture();
    value.server.closeServer = vi.fn(async () => { throw new Error('server close failed'); });
    const host = new BridgeHostLifecycle({ server: value.server, output: value.output, tray: value.tray, providerReady: true });
    host.start();

    await expect(host.shutdown()).rejects.toThrow('server close failed');
    expect(host.getStatus()).toBe('error');
    expect(host.isAcceptingInput()).toBe(false);
    expect(value.output.close).toHaveBeenCalledTimes(1);
  });
});
