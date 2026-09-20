import {
  HidMaestroProcess,
  HidMaestroProcessOptions
} from './hidmaestroProcess';
import { HidMaestroResponse } from './ipcProtocol';
import {
  VirtualControllerProvider,
  VirtualControllerState
} from './provider';

export type HidMaestroProviderOptions = HidMaestroProcessOptions & {
  profile?: 'xbox-360-wired';
};

function responseError(response: HidMaestroResponse): Error {
  return response.type === 'error'
    ? new Error(`HIDMaestro ${response.operation} failed: ${response.message}`)
    : new Error(`Unexpected HIDMaestro response: ${response.type}`);
}

export class HidMaestroProvider implements VirtualControllerProvider {
  readonly id = 'hidmaestro';
  readonly displayName = 'HIDMaestro Xbox 360 Wired';

  private readonly process: HidMaestroProcess;
  private readonly profile: 'xbox-360-wired';
  private ready = false;
  private closing = false;

  constructor(options: HidMaestroProviderOptions = {}) {
    this.profile = options.profile ?? 'xbox-360-wired';
    this.process = new HidMaestroProcess(options);
  }

  async initialize(): Promise<void> {
    if (this.ready) return;
    if (this.closing) throw new Error('HIDMaestro provider is closing');

    const response = await this.process.request('initialize', { profile: this.profile });
    if (response.type !== 'ready' || response.provider !== 'hidmaestro' || response.profile !== this.profile) {
      await this.process.close();
      throw responseError(response);
    }

    this.ready = true;
  }

  async apply(state: VirtualControllerState): Promise<void> {
    this.ensureReady();

    const response = await this.process.request('apply', {
      state: {
        leftStickX: state.leftStickX,
        leftStickY: state.leftStickY,
        rightTrigger: state.rightTrigger,
        leftTrigger: state.leftTrigger,
        buttons: [...state.buttons]
      }
    });

    if (response.type !== 'ok' || response.operation !== 'apply') {
      throw responseError(response);
    }
  }

  async releaseAll(): Promise<void> {
    if (!this.ready) return;

    const response = await this.process.request('releaseAll');
    if (response.type !== 'ok' || response.operation !== 'releaseAll') {
      throw responseError(response);
    }
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;

    try {
      if (this.ready) {
        const response = await this.process.request('close');
        if (response.type !== 'ok' || response.operation !== 'close') {
          throw responseError(response);
        }
      }
    } finally {
      this.ready = false;
      await this.process.close();
    }
  }

  isReady(): boolean {
    return this.ready;
  }

  private ensureReady(): void {
    if (!this.ready) throw new Error('HIDMaestro provider is not initialized');
  }
}
