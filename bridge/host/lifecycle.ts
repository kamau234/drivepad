import { BridgeOutput } from '../safety/watchdog';
import { DrivepadBridgeServer } from '../transport/websocketServer';
import { BridgeTrayLifecycle } from '../tray/lifecycle';

export type BridgeHostStatus =
  | 'stopped'
  | 'starting'
  | 'running-no-provider'
  | 'hidmaestro-ready'
  | 'error';

export type BridgeHostLifecycleOptions = {
  server: Pick<DrivepadBridgeServer, 'closeServer'>;
  output: BridgeOutput;
  tray?: BridgeTrayLifecycle;
  providerReady?: boolean;
  terminate?: (exitCode: number) => void;
};

/**
 * Owns host lifetime only. Controller mapping and provider I/O remain behind
 * BridgeOutput; the tray cannot apply controller state itself.
 */
export class BridgeHostLifecycle {
  private status: BridgeHostStatus = 'stopped';
  private shutdownPromise: Promise<void> | undefined;
  private started = false;
  private acceptingInput = false;

  constructor(private readonly options: BridgeHostLifecycleOptions) {}

  getStatus(): BridgeHostStatus {
    return this.status;
  }

  isAcceptingInput(): boolean {
    return this.acceptingInput;
  }

  start(): void {
    if (this.started || this.shutdownPromise) return;

    this.started = true;
    this.status = 'starting';
    this.options.tray?.show();

    this.acceptingInput = true;
    this.status = this.options.providerReady
      ? 'hidmaestro-ready'
      : 'running-no-provider';
  }

  markError(): void {
    if (this.shutdownPromise) return;
    this.acceptingInput = false;
    this.status = 'error';
  }

  async shutdown(exitCode?: number): Promise<void> {
    if (this.shutdownPromise) {
      await this.shutdownPromise;
      return;
    }

    this.shutdownPromise = this.performShutdown(exitCode);
    await this.shutdownPromise;
  }

  installProcessHandlers(processLike: NodeJS.Process = process): () => void {
    const shutdown = () => {
      void this.shutdown(0);
    };

    processLike.once('SIGINT', shutdown);
    processLike.once('SIGTERM', shutdown);
    processLike.once('beforeExit', shutdown);

    return () => {
      processLike.removeListener('SIGINT', shutdown);
      processLike.removeListener('SIGTERM', shutdown);
      processLike.removeListener('beforeExit', shutdown);
    };
  }

  private async performShutdown(exitCode?: number): Promise<void> {
    this.acceptingInput = false;
    this.status = 'stopped';
    this.options.tray?.hide();

    let failure: unknown;

    try {
      // closeServer disconnects the phone, disarms the watchdog, releases all
      // output, and stops accepting new WebSocket connections.
      await this.options.server.closeServer();
    } catch (error) {
      failure = error;
    }

    try {
      // Provider close is separate because the server owns transport lifetime,
      // while BridgeOutput owns the provider/helper lifetime.
      await this.options.output.close();
    } catch (error) {
      failure ??= error;
    }

    if (failure) {
      this.status = 'error';
      throw failure instanceof Error ? failure : new Error(String(failure));
    }

    if (exitCode !== undefined) {
      this.options.terminate?.(exitCode);
    }
  }
}
