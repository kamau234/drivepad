import { describe, expect, it } from 'vitest';
import { createHeartbeat, createHandshake, parseBridgeMessage, wrapBridgeMessage } from '../src/protocol/bridge';
import { DRIVEPAD_PROTOCOL_VERSION, neutralControllerState } from '../src/protocol/controller';

describe('bridge protocol wrapper', () => {
  it('serializes and parses authenticated bridge frames', () => {
    const sessionId = 'session-123';
    const payload = createHandshake(sessionId, 'DrivePad-PC');
    const parsed = parseBridgeMessage(payload);
    expect(parsed.type).toBe('handshake');
    expect(parsed.protocol).toBe(DRIVEPAD_PROTOCOL_VERSION);
    const heartbeat = createHeartbeat(sessionId, { ...neutralControllerState(), throttle: 0.5 });
    expect(JSON.parse(heartbeat).type).toBe('heartbeat');
  });

  it('rejects wrong protocol versions', () => {
    expect(() => parseBridgeMessage(wrapBridgeMessage({ protocol: 999, type: 'error', payload: 'bad' }))).toThrow('Unsupported bridge protocol version');
  });
});
