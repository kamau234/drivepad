export const DRIVEPAD_PROTOCOL_VERSION = 1;
export const CONTROLLER_PACKET_BYTES = 32;

export type DigitalInputs = {
  handbrake: boolean;
  gearUp: boolean;
  gearDown: boolean;
  nitrous: boolean;
  horn: boolean;
  pause: boolean;
};

export type ControllerState = DigitalInputs & {
  sequence: number;
  timestampMs: number;
  steering: number;
  throttle: number;
  brake: number;
  clutch: number;
  handbrakeAxis: number;
};

export type ControllerPacket = {
  version: number;
  sequence: number;
  timestampMs: number;
  state: ControllerState;
};

export const neutralControllerState = (timestampMs = Date.now()): ControllerState => ({
  sequence: 0,
  timestampMs,
  steering: 0,
  throttle: 0,
  brake: 0,
  clutch: 0,
  handbrakeAxis: 0,
  handbrake: false,
  gearUp: false,
  gearDown: false,
  nitrous: false,
  horn: false,
  pause: false
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

export function normalizeState(state: ControllerState): ControllerState {
  return {
    ...state,
    sequence: state.sequence >>> 0,
    timestampMs: Math.max(0, Math.floor(finite(state.timestampMs))),
    steering: clamp(finite(state.steering), -1, 1),
    throttle: clamp(finite(state.throttle), 0, 1),
    brake: clamp(finite(state.brake), 0, 1),
    clutch: clamp(finite(state.clutch), 0, 1),
    handbrakeAxis: clamp(finite(state.handbrakeAxis), 0, 1),
    handbrake: Boolean(state.handbrake),
    gearUp: Boolean(state.gearUp),
    gearDown: Boolean(state.gearDown),
    nitrous: Boolean(state.nitrous),
    horn: Boolean(state.horn),
    pause: Boolean(state.pause)
  };
}

/** Compact little-endian packet for the phone-to-bridge real-time path. */
export function encodeControllerPacket(state: ControllerState): Uint8Array {
  const normalized = normalizeState(state);
  const bytes = new Uint8Array(CONTROLLER_PACKET_BYTES);
  const view = new DataView(bytes.buffer);
  view.setUint8(0, DRIVEPAD_PROTOCOL_VERSION);
  view.setUint8(1, 0);
  view.setUint32(2, normalized.sequence, true);
  view.setUint32(6, normalized.timestampMs >>> 0, true);
  view.setInt16(10, Math.round(normalized.steering * 32767), true);
  view.setUint16(12, Math.round(normalized.throttle * 65535), true);
  view.setUint16(14, Math.round(normalized.brake * 65535), true);
  view.setUint16(16, Math.round(normalized.clutch * 65535), true);
  view.setUint16(18, Math.round(normalized.handbrakeAxis * 65535), true);
  let buttons = 0;
  [normalized.handbrake, normalized.gearUp, normalized.gearDown, normalized.nitrous, normalized.horn, normalized.pause].forEach((pressed, index) => { if (pressed) buttons |= 1 << index; });
  view.setUint16(20, buttons, true);
  return bytes;
}

export function decodeControllerPacket(data: ArrayBuffer | Uint8Array): ControllerPacket {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  if (bytes.byteLength !== CONTROLLER_PACKET_BYTES) throw new Error('Malformed controller packet length');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const version = view.getUint8(0);
  if (version !== DRIVEPAD_PROTOCOL_VERSION) throw new Error(`Unsupported protocol version: ${version}`);
  const sequence = view.getUint32(2, true);
  const timestampMs = view.getUint32(6, true);
  const buttons = view.getUint16(20, true);
  return { version, sequence, timestampMs, state: normalizeState({ sequence, timestampMs, steering: view.getInt16(10, true) / 32767, throttle: view.getUint16(12, true) / 65535, brake: view.getUint16(14, true) / 65535, clutch: view.getUint16(16, true) / 65535, handbrakeAxis: view.getUint16(18, true) / 65535, handbrake: Boolean(buttons & 1), gearUp: Boolean(buttons & 2), gearDown: Boolean(buttons & 4), nitrous: Boolean(buttons & 8), horn: Boolean(buttons & 16), pause: Boolean(buttons & 32) }) };
}

export function isNewerSequence(sequence: number, previous: number): boolean {
  const distance = (sequence - previous) >>> 0;
  return distance !== 0 && distance < 0x80000000;
}
