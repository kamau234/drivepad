import { VirtualControllerProvider } from './provider';

export type ProviderAvailability = {
  id: string;
  displayName: string;
  available: boolean;
  reason?: string;
};

/**
 * Provider discovery is deliberately explicit. DRIVEPAD never substitutes a
 * mock provider for a missing Windows driver.
 */
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
