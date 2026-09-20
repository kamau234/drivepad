import { DrivepadBridgeServer } from './transport/websocketServer';
import { BridgeOutput } from './safety/watchdog';

class UnavailableProvider implements BridgeOutput {
  async apply() { throw new Error('Virtual controller backend unavailable'); }
  async releaseAll() { /* safe no-op: no provider has been initialized */ }
  async close() { /* safe no-op */ }
}

const host = process.env.DRIVEPAD_HOST ?? '0.0.0.0';
const server = new DrivepadBridgeServer(new UnavailableProvider(), () => undefined, { host });
console.log(`DRIVEPAD bridge listening on ${host}:${server.getDiagnostics().port}`);
console.log('Controller output disabled: install and verify a maintained Windows provider before use.');
process.once('SIGINT', () => void server.closeServer().then(() => process.exit(0)));
