import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ChevronDown,
  Gauge,
  Hand,
  Menu,
  Radio,
  Settings,
  Zap
} from 'lucide-react';
import { InputEngine } from './input/inputEngine';
import { ControllerLoop } from './input/controllerLoop';
import { ControllerState, neutralControllerState } from './protocol/controller';
import './styles.css';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

function Steering({ engine }: { engine: InputEngine }) {
  const ref = useRef<HTMLDivElement>(null);

  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;

    const x = event.clientX - box.left;
    const normalized = ((x / box.width) * 2) - 1;
    engine.setAxis('steering', event.pointerId, clamp(normalized, -1, 1));
  };

  return (
    <div
      ref={ref}
      className="steering-zone"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) update(event);
      }}
      onPointerUp={(event) => {
        engine.releaseAxis('steering', event.pointerId);
      }}
      onPointerCancel={(event) => {
        engine.releaseAxis('steering', event.pointerId);
      }}
    >
      <div className="wheel-shell">
        <div className="wheel-core" />
        <span className="spoke s1" />
        <span className="spoke s2" />
        <span className="spoke s3" />
        <span className="spoke s4" />
      </div>
      <span className="zone-label">STEERING</span>
    </div>
  );
}

function PressZone({
  label,
  axis,
  engine,
  className
}: {
  label: string;
  axis: 'throttle' | 'brake';
  engine: InputEngine;
  className?: string;
}) {
  const update = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const normalized = 1 - clamp(y / rect.height, 0, 1);
    engine.setAxis(axis, event.pointerId, normalized);
  };

  return (
    <div
      className={`press-zone ${className ?? ''}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event);
      }}
      onPointerMove={(event) => {
        if (event.buttons > 0) update(event);
      }}
      onPointerUp={(event) => {
        engine.releaseAxis(axis, event.pointerId);
      }}
      onPointerCancel={(event) => {
        engine.releaseAxis(axis, event.pointerId);
      }}
    >
      <span>{label}</span>
    </div>
  );
}

function HoldButton({
  label,
  icon,
  button,
  engine,
  className = ''
}: {
  label: string;
  icon: React.ReactNode;
  button: 'handbrake' | 'nitrous' | 'gearUp' | 'gearDown';
  engine: InputEngine;
  className?: string;
}) {
  return (
    <button
      className={`control-button ${className}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        engine.press(button, event.pointerId);
      }}
      onPointerUp={(event) => {
        engine.release(button, event.pointerId);
      }}
      onPointerCancel={(event) => {
        engine.release(button, event.pointerId);
      }}
    >
      {icon}
      <b>{label}</b>
    </button>
  );
}

function App() {
  const engine = useMemo(() => new InputEngine(), []);
  const [state, setState] = useState<ControllerState>(neutralControllerState());
  const [connected, setConnected] = useState(false);
  const [autoGas, setAutoGas] = useState(false);

  useEffect(() => {
    const loop = new ControllerLoop(engine, setState);
    loop.start();
    return () => loop.stop();
  }, [engine]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const release = () => {
    engine.releaseAll();
    setState(engine.snapshot());
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <strong>DRIVEPAD</strong>
            <small>YOUR PHONE. YOUR WHEEL. YOUR RACE.</small>
          </div>
        </div>

        <div className="top-actions">
          <span className={`status-badge ${connected ? 'online' : ''}`}>
            <i />
            {connected ? 'CONNECTED' : 'NOT CONNECTED'}
          </span>

          <button type="button" aria-label="settings">
            <Settings size={19} />
          </button>
          <button type="button" aria-label="menu">
            <Menu size={21} />
          </button>
        </div>
      </header>

      <section className="commandbar">
        <div>
          <span className="eyebrow">RACING MODE</span>
          <h1>Ready when you are.</h1>
        </div>

        <div className="profile-pill">
          <span>PROFILE</span>
          <strong>
            Street Runner <ChevronDown size={15} />
          </strong>
        </div>

        <button
          type="button"
          className="connect-btn"
          onClick={() => setConnected((value) => !value)}
        >
          <Radio size={16} />
          {connected ? 'DISCONNECT' : 'PAIR PC'}
        </button>
      </section>

      <section className="cockpit" aria-label="Racing controls">
        <Steering engine={engine} />

        <div className="utility-controls">
          <HoldButton
            label="NITRO"
            icon={<Zap size={16} />}
            button="nitrous"
            engine={engine}
            className="nitro"
          />

          <HoldButton
            label="HANDBRAKE"
            icon={<Hand size={16} />}
            button="handbrake"
            engine={engine}
          />

          <button type="button" className="control-button compact">
            <Gauge size={16} />
            <b>CAMERA</b>
          </button>

          <button type="button" className="control-button compact">
            <Menu size={16} />
            <b>PAUSE</b>
          </button>

          <div className="gear-box">
            <HoldButton
              label="DOWNSHIFT"
              icon={<span>⇣</span>}
              button="gearDown"
              engine={engine}
            />
            <div className="gear-indicator">
              <span>GEAR</span>
              <b>N</b>
            </div>
            <HoldButton
              label="UPSHIFT"
              icon={<span>⇡</span>}
              button="gearUp"
              engine={engine}
            />
          </div>
        </div>

        <div className="pedal-stack">
          <PressZone label="THROTTLE" axis="throttle" engine={engine} className="throttle" />
          <PressZone label="BRAKE" axis="brake" engine={engine} className="brake" />
        </div>
      </section>

      <footer className="telemetry">
        <div>
          <span>STEERING</span>
          <b>{state.steering.toFixed(2)}</b>
        </div>
        <div>
          <span>THROTTLE</span>
          <b>{state.throttle.toFixed(2)}</b>
        </div>
        <div>
          <span>BRAKE</span>
          <b>{state.brake.toFixed(2)}</b>
        </div>
        <div className="hint-chip">
          <span>MULTI-TOUCH ENABLED</span>
          <i />
          <small>{autoGas ? 'AUTO GAS ON' : 'AUTO GAS OFF'}</small>
        </div>

        <button type="button" className="release-btn" onClick={release}>
          RELEASE ALL
        </button>
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
