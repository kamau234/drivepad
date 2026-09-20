import { HidMaestroProvider, HidMaestroProviderOptions } from './hidmaestroProvider';
import { VirtualControllerProvider } from './provider';

export type ProviderAvailability = {
  id: string;
  displayName: string;
  available: boolean;
  reason?: string;
};

export interface VirtualControllerProviderFactory {
  describe(): Promise<ProviderAvailability>;
  create(): Promise<VirtualControllerProvider>;
}

export class UnavailableProviderError extends Error {
  constructor(message = 'Virtual controller backend unavailable') {
    super(message);
    this.name = 'UnavailableProviderError';
  }
}

export class UnavailableProviderFactory implements VirtualControllerProviderFactory {
  async describe(): Promise<ProviderAvailability> {
    return {
      id: 'none',
      displayName: 'No virtual controller provider',
      available: false,
      reason: 'Install and verify a supported Windows virtual-controller backend.'
    };
  }

  async create(): Promise<VirtualControllerProvider> {
    throw new UnavailableProviderError();
  }
}

export class HidMaestroProviderFactory implements VirtualControllerProviderFactory {
  constructor(private readonly options: HidMaestroProviderOptions = {}) {}

  async describe(): Promise<ProviderAvailability> {
    if (process.platform !== 'win32') {
      return {
        id: 'hidmaestro',
        displayName: 'HIDMaestro Xbox 360 Wired',
        available: false,
        reason: 'HIDMaestro is supported only on Windows.'
      };
    }

    return {
      id: 'hidmaestro',
      displayName: 'HIDMaestro Xbox 360 Wired',
      available: true,
      reason: 'The helper and profile are verified during initialization.'
    };
  }

  async create(): Promise<VirtualControllerProvider> {
    const availability = await this.describe();
    if (!availability.available) throw new UnavailableProviderError(availability.reason);

    const provider = new HidMaestroProvider(this.options);
    try {
      await provider.initialize();
      return provider;
    } catch (error) {
      await provider.close().catch(() => undefined);
      throw new UnavailableProviderError(error instanceof Error ? error.message : String(error));
    }
  }
}
