import React, { useState } from 'react';
import { Wifi, X } from 'lucide-react';
import { WifiPairingDetails, WifiTransport } from './wifiTransport';

type Props = { onClose: () => void; onConnected: (transport: WifiTransport) => void };
export function PairingPanel({ onClose, onConnected }: Props) {
  const [url, setUrl] = useState('ws://192.168.1.20:17842');
  const [sessionId, setSessionId] = useState(''); const [code, setCode] = useState(''); const [nonce, setNonce] = useState(''); const [message, setMessage] = useState('');
  const connect = async () => {
    const details: WifiPairingDetails = { url, sessionId, code, nonce }; const transport = new WifiTransport(details);
    setMessage('CONNECTING...');
    try { await transport.connect(); onConnected(transport); } catch (error) { setMessage(error instanceof Error ? error.message : 'Connection failed.'); }
  };
  return <div className="pairing-overlay"><section className="pairing-card"><button className="close-panel" onClick={onClose} aria-label="Close"><X/></button><Wifi size={24}/><span className="eyebrow">WI-FI PAIRING</span><h2>Connect to DRIVEPAD Bridge</h2><p>Enter the bridge details shown in the Windows console. QR scanning will be added when the bridge installer is available.</p><label>WebSocket URL<input value={url} onChange={(e) => setUrl(e.target.value)} /></label><label>Session ID<input value={sessionId} onChange={(e) => setSessionId(e.target.value)} /></label><label>Pairing code<input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} /></label><label>Nonce<input value={nonce} onChange={(e) => setNonce(e.target.value)} /></label><button className="connect-btn" onClick={connect}>CONNECT</button>{message && <p className="pairing-message">{message}</p>}</section></div>;
}
