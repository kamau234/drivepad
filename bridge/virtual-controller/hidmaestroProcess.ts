import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { HidMaestroRequest, HidMaestroResponse, encodeIpcMessage, parseIpcMessage } from './ipcProtocol';

export type HidMaestroProcessOptions = {
  command?: string;
  args?: string[];
  cwd?: string;
  requestTimeoutMs?: number;
};

/** Minimal newline-delimited JSON client. The helper owns all HIDMaestro SDK objects. */
export class HidMaestroProcess {
  private readonly process: ChildProcessWithoutNullStreams;
  private readonly timeoutMs: number;
  private nextId = 1;
  private buffer = '';
  private closed = false;
  private readonly pending = new Map<number, { resolve: (response: HidMaestroResponse) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();

  constructor(options: HidMaestroProcessOptions = {}) {
    this.timeoutMs = options.requestTimeoutMs ?? 3000;
    this.process = spawn(options.command ?? 'dotnet', options.args ?? [process.env.DRIVEPAD_HIDMAESTRO_HELPER ?? 'HidMaestro.Helper.dll'], { cwd: options.cwd, stdio: 'pipe', windowsHide: true });
    this.process.stdout.setEncoding('utf8');
    this.process.stdout.on('data', (chunk: string) => this.read(chunk));
    this.process.on('error', (error) => this.failAll(error));
    this.process.on('exit', (code, signal) => this.failAll(new Error(`HIDMaestro helper exited (${code ?? signal ?? 'unknown'})`)));
  }

  request(type: HidMaestroRequest['type'], payload: Omit<HidMaestroRequest, 'id' | 'type'> = {}): Promise<HidMaestroResponse> {
    if (this.closed) return Promise.reject(new Error('HIDMaestro helper is closed'));
    const id = this.nextId++;
    const request = { id, type, ...payload } as HidMaestroRequest;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`HIDMaestro helper timed out on ${type}`)); }, this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.process.stdin.write(encodeIpcMessage(request), (error) => { if (error) { clearTimeout(timer); this.pending.delete(id); reject(error); } });
    });
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.pending.forEach(({ reject, timer }) => { clearTimeout(timer); reject(new Error('HIDMaestro helper closed')); });
    this.pending.clear();
    this.process.stdin.end();
    await new Promise<void>((resolve) => this.process.once('exit', () => resolve()));
  }

  private read(chunk: string) {
    this.buffer += chunk;
    let newline = this.buffer.indexOf('\n');
    while (newline >= 0) {
      const line = this.buffer.slice(0, newline).trim(); this.buffer = this.buffer.slice(newline + 1); newline = this.buffer.indexOf('\n');
      if (!line) continue;
      try { const response = parseIpcMessage(line); const pending = this.pending.get(response.id); if (!pending) continue; clearTimeout(pending.timer); this.pending.delete(response.id); pending.resolve(response); } catch (error) { this.failAll(error instanceof Error ? error : new Error(String(error))); }
    }
  }

  private failAll(error: Error) { for (const { reject, timer } of this.pending.values()) { clearTimeout(timer); reject(error); } this.pending.clear(); }
}
