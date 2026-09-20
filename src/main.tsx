import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChevronDown, Gauge, Hand, Menu, Radio, Settings, Zap } from 'lucide-react';
import { InputEngine } from './input/inputEngine';
import { ControllerLoop } from './input/controllerLoop';
import { ControllerState, neutralControllerState } from './protocol/controller';
import './styles.css';

function Steering({ engine }: { engine: InputEngine }) {
  const ref = useRef<HTMLDivElement>(null);
  const update = (event: React.PointerEvent) => { const box = ref.current?.getBoundingClientRect(); if (!box) return; const x = Math.max(0, Math.min(box.width, event.clientX - box.left)); engine.setAxis('steering', event.pointerId, (x / box.width) * 2 - 1); };
  return <div ref={ref} className="steering-zone" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }} onPointerMove={(e) => e.buttons > 0 && update(e)} onPointerUp={(e) => { engine.releaseAxis('steering', e.pointerId); }} onPointerCancel={(e) => engine.releasePointer(e.pointerId)}><div className="wheel"><div className="wheel-hub"/><span className="spoke s1"/><span className="spoke s2"/><span className="spoke s3"/></div><span className="zone-label">STEERING</span></div>;
}
function PressZone({ label, axis, engine, className }: { label: string; axis: 'throttle' | 'brake'; engine: InputEngine; className?: string }) {
  const update = (e: React.PointerEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); engine.setAxis(axis, e.pointerId, Math.max(0, Math.min(1, 1 - (e.clientY - r.top) / r.height))); };
  return <div className={`press-zone ${className || ''}`} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); update(e); }} onPointerMove={(e) => e.buttons > 0 && update(e)} onPointerUp={(e) => engine.releaseAxis(axis, e.pointerId)} onPointerCancel={(e) => engine.releasePointer(e.pointerId)}><span>{label}</span></div>;
}
function HoldButton({ label, icon, button, engine, className = '' }: { label: string; icon: React.ReactNode; button: 'handbrake' | 'nitrous' | 'gearUp' | 'gearDown'; engine: InputEngine; className?: string }) {
  return <button className={`control-button ${className}`} onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); engine.press(button, e.pointerId); }} onPointerUp={(e) => engine.release(button, e.pointerId)} onPointerCancel={(e) => engine.release(button, e.pointerId)}>{icon}<b>{label}</b></button>;
}
function App() {
  const engine = useMemo(() => new InputEngine(), []);
  const loop = useMemo(() => new ControllerLoop(engine, () => undefined), [engine]);
  const [state, setState] = useState<ControllerState>(neutralControllerState());
  const [connected, setConnected] = useState(false);
  useEffect(() => { const activeLoop = new ControllerLoop(engine, setState); activeLoop.start(); return () => activeLoop.stop(); }, [engine]);
  useEffect(() => { if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined); }, []);
  const release = () => { engine.releaseAll(); setState(engine.snapshot()); };
  return <main className="app"><header className="topbar"><div className="brand"><div className="brand-mark">D</div><div><strong>DRIVEPAD</strong><small>YOUR PHONE. YOUR WHEEL. YOUR RACE.</small></div></div><div className="top-actions"><span className={`status ${connected ? 'online' : ''}`}><i/> {connected ? 'CONNECTED' : 'NOT CONNECTED'}</span><button aria-label="Settings"><Settings size={19}/></button><button aria-label="Menu"><Menu size={21}/></button></div></header><section className="commandbar"><div><span className="eyebrow">RACING MODE</span><h1>Ready when you are.</h1></div><div className="profile"><span>PROFILE</span><strong>Street Runner <ChevronDown size={15}/></strong></div><button className="connect-btn" onClick={() => setConnected(false)}><Radio size={16}/> {connected ? 'DISCONNECT' : 'PAIR PC'}</button></section><section className="cockpit" aria-label="Racing controls"><Steering engine={engine}/><div className="utility"><HoldButton label="N₂O" icon={<Zap/>} button="nitrous" engine={engine} className="nitro"/><HoldButton label="HANDBRAKE" icon={<Hand/>} button="handbrake" engine={engine}/><button className="control-button"><Gauge/><b>CAMERA</b></button><button className="control-button"><Menu/><b>PAUSE</b></button><div className="gear"><HoldButton label="DOWNSHIFT" icon={<span>−</span>} button="gearDown" engine={engine}/><span>GEAR<br/><b>N</b></span><HoldButton label="UPSHIFT" icon={<span>＋</span>} button="gearUp" engine={engine}/></div></div><div className="pedals"><PressZone label="THROTTLE" axis="throttle" engine={engine} className="throttle"/><PressZone label="BRAKE" axis="brake" engine={engine} className="brake"/></div></section><footer className="telemetry"><div><span>STEERING</span><b>{state.steering.toFixed(2)}</b></div><div><span>THROTTLE</span><b>{state.throttle.toFixed(2)}</b></div><div><span>BRAKE</span><b>{state.brake.toFixed(2)}</b></div><div className="hint">MULTI-TOUCH ENABLED <i/> &nbsp; AUTO GAS OFF</div><button className="release-btn" onClick={release}>RELEASE ALL</button></footer></main>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
