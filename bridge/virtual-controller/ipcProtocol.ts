export type HidMaestroState = {
  leftStickX: number;
  leftStickY: number;
  rightTrigger: number;
  leftTrigger: number;
  buttons: string[];
};

export type HidMaestroRequest =
  | {
      id: number;
      type: 'initialize';
      profile: 'xbox-360-wired';
    }
  | {
      id: number;
      type: 'apply';
      state: HidMaestroState;
    }
  | {
      id: number;
      type: 'releaseAll';
    }
  | {
      id: number;
      type: 'close';
    };

export type HidMaestroResponse =
  | {
      id: number;
      type: 'ready';
      provider: 'hidmaestro';
      profile: string;
    }
  | {
      id: number;
      type: 'ok';
      operation: 'apply' | 'releaseAll' | 'close';
    }
  | {
      id: number;
      type: 'error';
      operation: string;
      message: string;
    };

export function encodeIpcMessage(message: HidMaestroRequest): string {
  return `${JSON.stringify(message)}\n`;
}

export function parseIpcMessage(line: string): HidMaestroResponse {
  const parsed: unknown = JSON.parse(line);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Malformed HIDMaestro helper response');
  }

  const response = parsed as Partial<HidMaestroResponse>;

  if (!Number.isInteger(response.id) || typeof response.type !== 'string') {
    throw new Error('Malformed HIDMaestro helper response');
  }

  if (
    response.type !== 'ready' &&
    response.type !== 'ok' &&
    response.type !== 'error'
  ) {
    throw new Error(`Unknown HIDMaestro helper response type: ${response.type}`);
  }

  return parsed as HidMaestroResponse;
}
