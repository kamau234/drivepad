import { networkInterfaces } from 'node:os';

function isPrivateIpv4(address: string) {
  const parts = address.split('.').map(Number);
  return parts.length === 4 && (parts[0] === 10 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
}

/** Selects a private LAN address, never a public interface, for phone pairing. */
export function detectPrivateIpv4() {
  for (const interfaces of Object.values(networkInterfaces())) {
    for (const address of interfaces ?? []) {
      if (address.family === 'IPv4' && !address.internal && isPrivateIpv4(address.address)) return address.address;
    }
  }
  return '127.0.0.1';
}
