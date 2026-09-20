import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bluetooth, ChevronDown, Gauge, Hand, Menu, Radio, Settings, Zap } from 'lucide-react';
import './styles.css';

type Inputs = { steering: number; throttle: number; brake: number; handbrake: boolean; nitrous: boolean };
const initialInputs: Inputs = { steering: 0, throttle: 0, brake: 0, handbrake: false, nitrous: false };

function Steering({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const update = (event: React.PointerEvent) => {
    const box = ref.current?.getBoundingClientRect(); if (!box) return;
    const x = Math.max(0, Math.min(box.width, event.clientX - box.left));
    onChange((x / box.width) * 2 - 1);
  };
  return <div ref={ref} className="steering-zone" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }} onPointerMove={(e) => e.buttons > 0 && update(e)} onPointerUp={() => onChange(0)}>
    <div className="wheel" style={{ transform: `rotate(${value * 120}deg)` }}><div className="wheel-hub"/><span className="spoke s1"/><span className="spoke s2"/><span className="spoke s3"/></div>
    <span className="zone-label">STEERING</span><span className="axis-readout">{value.toFixed(2)}</span>
  </div>;
}
function PressZone({ label, className, onValue }: { label: string; className?: string; onValue: (v: number) => void }) {
  const update = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); onValue(Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))); };
  return <div className={`press-zone ${className || ''}`} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }} onPointerMove={(e) => e.buttons > 0 && update(e)} onPointerUp={() => onValue(0)}><span>{label}</span></div>;
}
function App() {
  const [inputs, setInputs] = useState(initialInputs);
  const [connected, setConnected] = useState(false);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const set = (patch: Partial<Inputs>) => setInputs((current) => ({ ...current, ...patch }));
  return <main className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark">D</div><div><strong>DRIVEPAD</strong><small>YOUR PHONE. YOUR WHEEL. YOUR RACE.</small></div></div><div className="top-actions"><span className={`status ${connected ? 'online' : ''}`}><i/> {connected ? 'CONNECTED' : 'NOT CONNECTED'}</span><button aria-label="Settings"><Settings size={19}/></button><button aria-label="Menu"><Menu size={21}/></button></div></header>
    <section className="commandbar"><div><span className="eyebrow">RACING MODE</span><h1>Ready when you are.</h1></div><div className="profile"><span>PROFILE</span><strong>Street Runner <ChevronDown size={15}/></strong></div><button className="connect-btn" onClick={() => setConnected(!connected)}><Radio size={16}/>{connected ? 'DISCONNECT' : 'CONNECT PC'}</button></section>
    <section className="cockpit" aria-label="Racing controls"><Steering value={inputs.steering} onChange={(steering) => set({ steering })}/><div className="utility"><button className={`control-button nitro ${inputs.nitrous ? 'active' : ''}`} onPointerDown={() => set({ nitrous: true })} onPointerUp={() => set({ nitrous: false })}><Zap/><b>N₂O</b><small>NITROUS</small></button><button className={`control-button ${inputs.handbrake ? 'active' : ''}`} onPointerDown={() => set({ handbrake: true })} onPointerUp={() => set({ handbrake: false })}><Hand/><b>HANDBRAKE</b></button><button className="control-button"><Gauge/><b>CAMERA</b></button><button className="control-button"><Menu/><b>PAUSE</b></button><div className="gear"><button>−</button><span>GEAR<br/><b>N</b></span><button>＋</button></div></div><div className="pedals"><PressZone label="THROTTLE" className="throttle" onValue={(throttle) => set({ throttle })}/><PressZone label="BRAKE" className="brake" onValue={(brake) => set({ brake })}/></div></section>
    <footer className="telemetry"><div><span>STEERING</span><b>{inputs.steering.toFixed(2)}</b></div><div><span>THROTTLE</span><b>{inputs.throttle.toFixed(2)}</b></div><div><span>BRAKE</span><b>{inputs.brake.toFixed(2)}</b></div><div className="hint">MULTI-TOUCH ENABLED <i/> &nbsp; AUTO GAS OFF</div></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
