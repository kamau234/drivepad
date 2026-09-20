export type HostRuntimeState = 'stopped' | 'starting' | 'running' | 'error';
export type TransportState = 'stopped' | 'listening' | 'connected' | 'error';
export type PhoneSessionState = 'disconnected' | 'connected' | 'authenticated';
export type WatchdogState = 'disarmed' | 'armed' | 'released';
export type ReleaseState = 'idle' | 'released' | 'shutting-down' | 'complete' | 'error';

export type ProviderStatus = {
  id: string;
  displayName: string;
  discovered: boolean;
  initialized: boolean;
  ready: boolean;
  controllerDeviceCreated: boolean;
};

export type BridgeStatus = {
  host: HostRuntimeState;
  transport: TransportState;
  phoneSession: PhoneSessionState;
  provider: ProviderStatus;
  watchdog: WatchdogState;
  lastPacketAt: number | null;
  lastAppliedSequence: number | null;
  packetsReceived: number;
  rejectedPackets: number;
  lastError: string | null;
  release: ReleaseState;
};

export type BridgeStatusOptions = {
  provider?: Partial<ProviderStatus>;
  host?: HostRuntimeState;
};

export function createBridgeStatus(options: BridgeStatusOptions = {}): BridgeStatus {
  return {
    host: options.host ?? 'starting',
    transport: 'stopped',
    phoneSession: 'disconnected',
    provider: {
      id: options.provider?.id ?? 'none',
      displayName: options.provider?.displayName ?? 'No virtual controller provider',
      discovered: options.provider?.discovered ?? false,
      initialized: options.provider?.initialized ?? false,
      ready: options.provider?.ready ?? false,
      controllerDeviceCreated: options.provider?.controllerDeviceCreated ?? false
    },
    watchdog: 'disarmed',
    lastPacketAt: null,
    lastAppliedSequence: null,
    packetsReceived: 0,
    rejectedPackets: 0,
    lastError: null,
    release: 'idle'
  };
}

export function copyBridgeStatus(status: BridgeStatus): BridgeStatus {
  return { ...status, provider: { ...status.provider } };
}

export function actionableError(error: unknown, fallback = 'Bridge operation failed'): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.trim() || fallback;
}
