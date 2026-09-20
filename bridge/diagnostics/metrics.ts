export type BridgeMetrics = {
  listening: boolean;
  host: string;
  port: number;
  connected: boolean;
  authenticated: boolean;
  packetsReceived: number;
  rejectedPackets: number;
  lastPacketAt: number | null;
  lastSequence: number | null;
  watchdog: 'armed' | 'released' | 'disarmed';
  provider: string;
  averageLatencyMs: number;
  peakLatencyMs: number;
  packetRateHz: number;
};

export class BridgeDiagnostics {
  private readonly samples: number[] = [];
  private readonly sampleWindowMs = 15_000;
  private lastPacketAt: number | null = null;
  private lastSequence: number | null = null;
  private packets = 0;
  private rejected = 0;
  private startedAt = Date.now();

  snapshot(): BridgeMetrics {
    const now = Date.now();
    const packetRate = this.packets > 0 ? this.packets / Math.max(1, (now - this.startedAt) / 1000) : 0;
    const avgLatency = this.samples.length ? this.samples.reduce((total, value) => total + value, 0) / this.samples.length : 0;
    const peakLatency = this.samples.length ? Math.max(...this.samples) : 0;

    return {
      listening: true,
      host: '0.0.0.0',
      port: 17842,
      connected: true,
      authenticated: true,
      packetsReceived: this.packets,
      rejectedPackets: this.rejected,
      lastPacketAt: this.lastPacketAt,
      lastSequence: this.lastSequence,
      watchdog: 'armed',
      provider: 'hidmaestro',
      averageLatencyMs: avgLatency,
      peakLatencyMs: peakLatency,
      packetRateHz: packetRate
    };
  }

  recordPacket(sequence: number, receivedAt = Date.now(), latencyMs?: number): void {
    this.packets += 1;
    this.lastPacketAt = receivedAt;
    this.lastSequence = sequence;

    if (typeof latencyMs === 'number' && Number.isFinite(latencyMs)) {
      this.samples.push(latencyMs);
      const cutoff = receivedAt - this.sampleWindowMs;
      while (this.samples.length && this.samples[0] <= cutoff) {
        this.samples.shift();
      }
    }
  }

  recordRejectedPacket(): void {
    this.rejected += 1;
  }

  reset(): void {
    this.samples.length = 0;
    this.packets = 0;
    this.rejected = 0;
    this.lastPacketAt = null;
    this.lastSequence = null;
    this.startedAt = Date.now();
  }
}

export const bridgeDiagnostics = new BridgeDiagnostics();
