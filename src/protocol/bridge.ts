import {
  ControllerState,
  DRIVEPAD_PROTOCOL_VERSION,
  neutralControllerState
} from './controller';

export type BridgePacket = {
  protocol: number;
  type: 'state' | 'heartbeat' | 'handshake' | 'pairing' | 'error';
  sequence?: number;
  sessionId?: string;
  timestampMs?: number;
  state?: ControllerState;
  code?: string;
  payload?: string;
};

export function wrapBridgeMessage(packet: BridgePacket): string {
  return JSON.stringify(packet);
}

export function parseBridgeMessage(payload: string): BridgePacket {
  const parsed = JSON.parse(payload) as BridgePacket;

  if (parsed.protocol !== DRIVEPAD_PROTOCOL_VERSION) {
    throw new Error('Unsupported bridge protocol version');
  }

  return parsed;
}

export function createHandshake(
  sessionId: string,
  pcName: string
): string {
  return wrapBridgeMessage({
    protocol: DRIVEPAD_PROTOCOL_VERSION,
    type: 'handshake',
    sessionId,
    payload: `${pcName}:${sessionId}`
  });
}

export function createHeartbeat(
  sessionId: string,
  state: ControllerState = neutralControllerState()
): string {
  return wrapBridgeMessage({
    protocol: DRIVEPAD_PROTOCOL_VERSION,
    type: 'heartbeat',
    sessionId,
    state,
    timestampMs: Date.now()
  });
}
