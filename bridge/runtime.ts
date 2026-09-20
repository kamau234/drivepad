import { DrivepadBridgeServer } from './transport/websocketServer';
import { BridgeOutput } from './safety/watchdog';

/** Explicitly refuses to fake a Windows controller until a maintained backend is installed. */
class UnavailableProvider implements BridgeOutput {
  async apply() { throw new Error('Virtual controller backend unavailable'); }
  async releaseAll() { /* safe no-op: no provider has been initialized */ }
  async close() { /* safe no-op */ }
}

const server = new DrivepadBridgeServer(new UnavailableProvider(), () => undefined);
console.log(`DRIVEPAD bridge listening on localhost:${server.getDiagnostics().port}`);
console.log('Controller output disabled: install and verify a maintained Windows provider before use.');
process.once('SIGINT', () => void server.closeServer().then(() => process.exit(0)));
