import { DrivepadBridgeServer } from './transport/websocketServer';
import { BridgeOutput } from './safety/watchdog';
import { detectPrivateIpv4 } from './network/interfaces';
import { BridgePairingRegistry } from './security/pairingRegistry';

class UnavailableProvider implements BridgeOutput {
  async apply() { throw new Error('Virtual controller backend unavailable'); }
  async releaseAll() { /* safe no-op: no provider has been initialized */ }
  async close() { /* safe no-op */ }
}

const host = process.env.DRIVEPAD_HOST ?? detectPrivateIpv4();
const port = Number(process.env.DRIVEPAD_PORT ?? 17842);
const pairing = new BridgePairingRegistry();
const server = new DrivepadBridgeServer(new UnavailableProvider(), (sessionId, code) => pairing.verify(sessionId, code), { host, port });
const session = pairing.publicSession;
console.log(`DRIVEPAD bridge listening on ws://${host}:${port}`);
console.log(`Pairing session: ${session.id}`);
console.log(`Pairing code: ${session.code} (expires in 5 minutes)`);
console.log(`Pairing nonce: ${session.nonce}`);
console.log('Controller output disabled: install and verify a maintained Windows provider before use.');
process.once('SIGINT', () => { pairing.revoke(); void server.closeServer().then(() => process.exit(0)); });
