export type HidMaestroState = {
  leftStickX: number;
  leftStickY: number;
  rightTrigger: number;
  leftTrigger: number;
  buttons: string[];
};

export type HidMaestroRequest =
  | { id: number; type: 'initialize'; profile: string }
  | { id: number; type: 'apply'; state: HidMaestroState }
  | { id: number; type: 'releaseAll' }
  | { id: number; type: 'close' };

export type HidMaestroResponse =
  | { id: number; type: 'ready'; provider: 'hidmaestro'; profile: string }
  | { id: number; type: 'ok'; operation: 'apply' | 'releaseAll' | 'close' }
  | { id: number; type: 'error'; operation: string; message: string };

export function encodeIpcMessage(message: HidMaestroRequest): string {
  return `${JSON.stringify(message)}\n`;
}

export function parseIpcMessage(line: string): HidMaestroResponse {
  const message = JSON.parse(line) as HidMaestroResponse;
  if (!Number.isInteger(message.id) || typeof message.type !== 'string') throw new Error('Malformed HIDMaestro helper response');
  return message;
}
