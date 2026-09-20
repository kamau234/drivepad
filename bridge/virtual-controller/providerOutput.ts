import { BridgeOutput } from '../safety/watchdog';
import { ControllerState } from '../../src/protocol/controller';
import { mapDrivepadToVirtualController, VirtualControllerProvider } from './provider';

export class VirtualControllerOutput implements BridgeOutput {
  constructor(private readonly provider: VirtualControllerProvider) {}

  async apply(state: ControllerState): Promise<void> {
    await this.provider.apply(mapDrivepadToVirtualController(state));
  }

  async releaseAll(): Promise<void> {
    await this.provider.releaseAll();
  }

  async close(): Promise<void> {
    await this.provider.close();
  }
}
