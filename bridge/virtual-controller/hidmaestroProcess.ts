import {
  ChildProcessWithoutNullStreams,
  spawn
} from 'node:child_process';

import {
  HidMaestroRequest,
  HidMaestroResponse,
  encodeIpcMessage,
  parseIpcMessage
} from './ipcProtocol';

export type HidMaestroProcessOptions = {
  command?: string;
  args?: string[];
  cwd?: string;
  requestTimeoutMs?: number;
  shutdownTimeoutMs?: number;
};

type PendingRequest = {
  resolve: (response: HidMaestroResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

export class HidMaestroProcess {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly requestTimeoutMs: number;
  private readonly shutdownTimeoutMs: number;
  private readonly pending = new Map<number, PendingRequest>();
  private nextRequestId = 1;
  private stdoutBuffer = '';
  private closed = false;
  private failed = false;

  constructor(options: HidMaestroProcessOptions = {}) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 3000;
    this.shutdownTimeoutMs = options.shutdownTimeoutMs ?? 3000;

    const helperPath = process.env.DRIVEPAD_HIDMAESTRO_HELPER ??
      'bridge/virtual-controller/hidmaestro-helper/bin/Release/net10.0-windows10.0.26100.0/HidMaestro.Helper.dll';

    this.child = spawn(options.command ?? 'dotnet', options.args ?? [helperPath], {
      cwd: options.cwd,
      stdio: 'pipe',
      windowsHide: true
    });

    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk: string) => this.readStdout(chunk));
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk: string) => process.stderr.write(`[hidmaestro-helper] ${chunk}`));
    this.child.on('error', (error) => this.fail(error));
    this.child.on('exit', (code, signal) => {
      if (!this.closed) this.fail(new Error(`HIDMaestro helper exited unexpectedly (${code ?? signal ?? 'unknown'})`));
    });
  }

  request(type: HidMaestroRequest['type'], payload: Omit<HidMaestroRequest, 'id' | 'type'> = {}): Promise<HidMaestroResponse> {
    if (this.closed) return Promise.reject(new Error('HIDMaestro helper is closed'));
    if (this.failed) return Promise.reject(new Error('HIDMaestro helper is unavailable'));

    const id = this.nextRequestId++;
    const request = { id, type, ...payload } as HidMaestroRequest;

    return new Promise<HidMaestroResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`HIDMaestro helper timed out during ${type}`));
      }, this.requestTimeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(encodeIpcMessage(request), (error?: Error | null) => {
        if (!error) return;
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
        this.fail(error);
      });
    });
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('HIDMaestro helper is closing'));
    }
    this.pending.clear();

    if (this.child.stdin.writable) this.child.stdin.end();

    await new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      this.child.once('exit', finish);
      setTimeout(() => {
        if (!this.child.killed) this.child.kill();
        finish();
      }, this.shutdownTimeoutMs);
    });
  }

  private readStdout(chunk: string): void {
    this.stdoutBuffer += chunk;
    let newlineIndex = this.stdoutBuffer.indexOf('\n');

    while (newlineIndex >= 0) {
      const line = this.stdoutBuffer.slice(0, newlineIndex).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newlineIndex + 1);
      newlineIndex = this.stdoutBuffer.indexOf('\n');
      if (!line) continue;

      try {
        const response = parseIpcMessage(line);
        const pending = this.pending.get(response.id);
        if (!pending) continue;
        clearTimeout(pending.timer);
        this.pending.delete(response.id);
        pending.resolve(response);
      } catch (error) {
        this.fail(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private fail(error: Error): void {
    if (this.failed) return;
    this.failed = true;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }
}
