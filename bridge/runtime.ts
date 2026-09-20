import { DrivepadBridgeServer } from './transport/websocketServer';
import { BridgeOutput } from './safety/watchdog';
import { detectPrivateIpv4 } from './network/interfaces';
import { BridgePairingRegistry } from './security/pairingRegistry';
import { VirtualControllerOutput } from './virtual-controller/providerOutput';
import {
  HidMaestroProviderFactory,
  UnavailableProviderFactory,
  VirtualControllerProviderFactory
} from './virtual-controller/providerFactory';

class UnavailableOutput implements BridgeOutput {
  async apply(): Promise<void> {
    throw new Error('Virtual controller backend unavailable');
  }
  async releaseAll(): Promise<void> {}
  async close(): Promise<void> {}
}

function selectFactory(): VirtualControllerProviderFactory {
  switch ((process.env.DRIVEPAD_PROVIDER ?? 'none').toLowerCase()) {
    case 'hidmaestro':
      return new HidMaestroProviderFactory();
    case 'none':
    case 'unavailable':
      return new UnavailableProviderFactory();
    default:
      throw new Error(`Unknown DRIVEPAD_PROVIDER: ${process.env.DRIVEPAD_PROVIDER}`);
  }
}

async function main(): Promise<void> {
  const host = process.env.DRIVEPAD_HOST ?? detectPrivateIpv4();
  const port = Number(process.env.DRIVEPAD_PORT ?? 17842);
  const factory = selectFactory();
  const availability = await factory.describe();

  let output: BridgeOutput = new UnavailableOutput();
  let providerStatus = 'unavailable';

  if (availability.available) {
    const provider = await factory.create();
    output = new VirtualControllerOutput(provider);
    providerStatus = `${provider.id}:ready`;
  }

  const pairing = new BridgePairingRegistry();
  const server = new DrivepadBridgeServer(
    output,
    (sessionId, code) => pairing.verify(sessionId, code),
    { host, port }
  );
  const session = pairing.publicSession;

  console.log(`DRIVEPAD bridge listening on ws://${host}:${port}`);
  console.log(`Pairing session: ${session.id}`);
  console.log(`Pairing code: ${session.code} (expires in 5 minutes)`);
  console.log(`Pairing nonce: ${session.nonce}`);
  console.log(`Controller provider: ${providerStatus}`);

  const shutdown = async () => {
    pairing.revoke();
    await server.closeServer();
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
}

void main().catch((error) => {
  console.error(`DRIVEPAD bridge failed to start: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
