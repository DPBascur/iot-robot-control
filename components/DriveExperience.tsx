'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb, Mic, Volume2, X } from 'lucide-react';

import { PageShell } from '@/components/PageShell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import VideoPlaceholder from '@/components/VideoPlaceholder';

import { connectSocket } from '@/lib/socket';
import type { RobotCommand } from '@/lib/types';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (navigator.maxTouchPoints ?? 0) > 0 ||
    window.matchMedia?.('(pointer: coarse)')?.matches
  );
}

function useIsMobileLike() {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // "mobile-like": touch + pantalla relativamente pequeña
      setMobile(isTouchDevice() && Math.min(w, h) < 900);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return mobile;
}

function useLandscapeRequired(enabled: boolean) {
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setIsLandscape(true);
      return;
    }

    const update = () => {
      setIsLandscape(window.innerWidth >= window.innerHeight);
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [enabled]);

  return isLandscape;
}

function useRobotCommandSender() {
  const socketRef = useRef<ReturnType<typeof connectSocket> | null>(null);
  const lastSentRef = useRef<{
    throttle: number;
    steer: number;
    cameraPan: number;
    cameraTilt: number;
    maxPower: number;
    horn: boolean;
    lights: boolean;
  }>({
    throttle: 0,
    steer: 0,
    cameraPan: 0,
    cameraTilt: 0,
    maxPower: 70,
    horn: false,
    lights: false,
  });
  const desiredRef = useRef<{
    throttle: number;
    steer: number;
    cameraPan: number;
    cameraTilt: number;
    maxPower: number;
    horn: boolean;
    lights: boolean;
  }>({
    throttle: 0,
    steer: 0,
    cameraPan: 0,
    cameraTilt: 0,
    maxPower: 70,
    horn: false,
    lights: false,
  });

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    const interval = window.setInterval(() => {
      const desired = desiredRef.current;
      const last = lastSentRef.current;
      if (
        desired.throttle === last.throttle &&
        desired.steer === last.steer &&
        desired.cameraPan === last.cameraPan &&
        desired.cameraTilt === last.cameraTilt &&
        desired.maxPower === last.maxPower &&
        desired.horn === last.horn &&
        desired.lights === last.lights
      ) {
        return;
      }

      const payload: RobotCommand = {
        throttle: desired.throttle,
        steer: desired.steer,
        cameraPan: desired.cameraPan,
        cameraTilt: desired.cameraTilt,
        maxPower: desired.maxPower,
        horn: desired.horn,
        lights: desired.lights,
        timestamp: Date.now(),
      };

      socket.emit('robot:command', payload);
      lastSentRef.current = desired;
    }, 50);

    const stop = () => {
      desiredRef.current = {
        ...desiredRef.current,
        throttle: 0,
        steer: 0,
        cameraPan: 0,
        cameraTilt: 0,
        horn: false,
      };
    };

    window.addEventListener('blur', stop);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') stop();
    });

    return () => {
      window.clearInterval(interval);
      stop();
      window.removeEventListener('blur', stop);
    };
  }, []);

  const setMaxPower = (maxPower: number) => {
    desiredRef.current = {
      ...desiredRef.current,
      maxPower: Math.round(clamp(maxPower, 0, 100)),
    };
  };

  const setMovement = (throttle: number, steer: number) => {
    const maxPower = desiredRef.current.maxPower;
    const scaledThrottle = throttle * (maxPower / 100);
    desiredRef.current = {
      ...desiredRef.current,
      throttle: Math.round(clamp(scaledThrottle, -100, 100)),
      steer: Math.round(clamp(steer, -90, 90)),
    };
  };

  const setCamera = (cameraPan: number, cameraTilt: number) => {
    desiredRef.current = {
      ...desiredRef.current,
      cameraPan: Math.round(clamp(cameraPan, -90, 90)),
      cameraTilt: Math.round(clamp(cameraTilt, -45, 45)),
    };
  };

  const setHorn = (horn: boolean) => {
    desiredRef.current = {
      ...desiredRef.current,
      horn,
    };
  };

  const setLights = (lights: boolean) => {
    desiredRef.current = {
      ...desiredRef.current,
      lights,
    };
  };

  return {
    setMovement,
    setCamera,
    setMaxPower,
    setHorn,
    setLights,
    getDesired: () => desiredRef.current,
  };
}

function DesktopControls() {
  const { setMovement, setCamera, setMaxPower } = useRobotCommandSender();
  const [throttle, setThrottle] = useState(0);
  const [steer, setSteer] = useState(0);
  const [cameraPan, setCameraPan] = useState(0);
  const [cameraTilt, setCameraTilt] = useState(0);
  const [maxPower, setMaxPowerState] = useState(70);

  const maxPowerRef = useRef(70);
  const throttleRef = useRef(0);
  const steerRef = useRef(0);
  const cameraPanRef = useRef(0);
  const cameraTiltRef = useRef(0);

  const keysRef = useRef({ w: false, s: false, a: false, d: false, up: false, down: false, left: false, right: false, shift: false });

  useEffect(() => {
    maxPowerRef.current = maxPower;
  }, [maxPower]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
          'W',
          'A',
          'S',
          'D',
          'Shift',
          ' ',
        ].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === 'Shift') keysRef.current.shift = true;
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = true;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = true;
      if (e.key === 'ArrowUp') keysRef.current.up = true;
      if (e.key === 'ArrowDown') keysRef.current.down = true;
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
      if (e.key === ' ') {
        // stop
        keysRef.current = { w: false, s: false, a: false, d: false, up: false, down: false, left: false, right: false, shift: false };
        throttleRef.current = 0;
        steerRef.current = 0;
        cameraPanRef.current = 0;
        cameraTiltRef.current = 0;
        setThrottle(0);
        setSteer(0);
        setCameraPan(0);
        setCameraTilt(0);
        setMovement(0, 0);
        setCamera(0, 0);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') keysRef.current.shift = false;
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = false;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = false;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = false;
      if (e.key === 'ArrowUp') keysRef.current.up = false;
      if (e.key === 'ArrowDown') keysRef.current.down = false;
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);

    let raf = 0;
    const loop = () => {
      const k = keysRef.current;

      // Potenciómetro
      setMaxPower(maxPowerRef.current);

      // Si se mantiene SHIFT, las teclas controlan la cámara
      const cameraMode = k.shift;

      // target values (movimiento)
      const upPressed = k.w || k.up;
      const downPressed = k.s || k.down;
      const leftPressed = k.a || k.left;
      const rightPressed = k.d || k.right;

      const targetThrottle = upPressed ? 100 : downPressed ? -60 : 0;
      const targetSteer = leftPressed ? -80 : rightPressed ? 80 : 0;

      // target values (cámara)
      const targetPan = leftPressed ? -70 : rightPressed ? 70 : 0;
      const targetTilt = upPressed ? 45 : downPressed ? -45 : 0;

      // smooth approach
      const nextThrottle = Math.abs(throttleRef.current + (targetThrottle - throttleRef.current) * 0.18) < 0.6
        ? 0
        : throttleRef.current + (targetThrottle - throttleRef.current) * 0.18;
      const nextSteer = Math.abs(steerRef.current + (targetSteer - steerRef.current) * 0.22) < 0.6
        ? 0
        : steerRef.current + (targetSteer - steerRef.current) * 0.22;
      const nextPan = Math.abs(cameraPanRef.current + (targetPan - cameraPanRef.current) * 0.22) < 0.6
        ? 0
        : cameraPanRef.current + (targetPan - cameraPanRef.current) * 0.22;
      const nextTilt = Math.abs(cameraTiltRef.current + (targetTilt - cameraTiltRef.current) * 0.22) < 0.6
        ? 0
        : cameraTiltRef.current + (targetTilt - cameraTiltRef.current) * 0.22;

      throttleRef.current = nextThrottle;
      steerRef.current = nextSteer;
      cameraPanRef.current = nextPan;
      cameraTiltRef.current = nextTilt;

      setThrottle(nextThrottle);
      setSteer(nextSteer);
      setCameraPan(nextPan);
      setCameraTilt(nextTilt);

      if (cameraMode) {
        setCamera(nextPan, nextTilt);
      } else {
        setMovement(nextThrottle, nextSteer);
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(raf);
      setMovement(0, 0);
      setCamera(0, 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMovement, setCamera, setMaxPower]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section
        className="p-6 border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
          animation: 'fadeUp 240ms ease-out both',
        }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Cámara
        </h2>
        <VideoPlaceholder />
      </section>

      <section
        className="p-6 border"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
          animation: 'fadeUp 240ms ease-out both',
          animationDelay: '60ms',
        }}
      >
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Controles (Teclado)
        </h2>

        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Movimiento: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>A/D</span> dirección,
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}> W/S</span> acelera/reversa.
          </p>
          <p>
            Cámara: <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Shift</span> + WASD.
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}> Espacio</span> = STOP.
          </p>
        </div>

        <div className="mt-5 p-4 border" style={{ borderColor: 'var(--border)', borderRadius: 12, backgroundColor: 'var(--app-bg)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Potenciómetro (potencia/voltaje máximo)
            </div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {maxPower}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={maxPower}
            onChange={(e) => setMaxPowerState(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 border" style={{ borderColor: 'var(--border)', borderRadius: 12, backgroundColor: 'var(--app-bg)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Aceleración
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(throttle)}%
            </div>
          </div>
          <div className="p-4 border" style={{ borderColor: 'var(--border)', borderRadius: 12, backgroundColor: 'var(--app-bg)' }}>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Dirección
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round(steer)}°
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileControls() {
  const { setMovement, setCamera, setMaxPower, setHorn, setLights } = useRobotCommandSender();
  const isLandscape = useLandscapeRequired(true);
  const [move, setMove] = useState({ x: 0, y: 0 });
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [hornOn, setHornOn] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [maxPower, setMaxPowerState] = useState(100);

  // map joystick -> throttle/steer
  useEffect(() => {
    setMaxPower(maxPower);
    const steer = move.x * 90;
    const throttle = -move.y * 100;
    setMovement(throttle, steer);
  }, [setMaxPower, maxPower, setMovement, move]);

  // map joystick cam -> pan/tilt
  useEffect(() => {
    const pan = cam.x * 90;
    const tilt = -cam.y * 45;
    setCamera(pan, tilt);
  }, [setCamera, cam]);

  useEffect(() => {
    setHorn(hornOn);
  }, [hornOn, setHorn]);

  useEffect(() => {
    setLights(lightsOn);
  }, [lightsOn, setLights]);

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Pestañita / panel superior (no reserva espacio) */}
      <div className="absolute left-0 right-0 top-0" style={{ padding: 10, pointerEvents: 'none', zIndex: 50 }}>
        {!panelOpen ? (
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="px-3 py-2 rounded-full border text-sm font-semibold"
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'rgba(17,24,39,0.55)',
              borderColor: 'rgba(255,255,255,0.18)',
              color: 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            Control
          </button>
        ) : (
          <div
            className="border"
            style={{
              pointerEvents: 'auto',
              backgroundColor: 'rgba(17,24,39,0.72)',
              borderColor: 'rgba(255,255,255,0.18)',
              borderRadius: 16,
              padding: 10,
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex items-center justify-between" style={{ gap: 10 }}>
              <div className="flex items-center gap-3">
                <Link href="/dashboard" className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Volver
                </Link>
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  Control
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border text-sm font-semibold"
                  style={{
                    backgroundColor: isTalking ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.06)',
                    borderColor: isTalking ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                  onPointerDown={() => setIsTalking(true)}
                  onPointerUp={() => setIsTalking(false)}
                  onPointerCancel={() => setIsTalking(false)}
                >
                  <span className="inline-flex items-center gap-2">
                    <Mic size={16} />
                    {isTalking ? 'Hablando…' : 'Hablar'}
                  </span>
                </button>

                <ThemeToggle />

                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="p-2 rounded-lg border"
                  aria-label="Cerrar"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    borderColor: 'rgba(255,255,255,0.14)',
                    color: 'rgba(255,255,255,0.92)',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Opcional: potenciómetro en panel (no ocupa la pantalla si lo cierras) */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Potencia máx (opcional)
                </div>
                <div className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
                  {maxPower}%
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={maxPower}
                onChange={(e) => setMaxPowerState(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Landscape gate */}
      {!isLandscape && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-8"
          style={{
            backgroundColor: 'var(--app-bg)',
            color: 'var(--text-primary)',
          }}
        >
          <div
            className="p-6 border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
              animation: 'popIn 240ms ease-out both',
            }}
          >
            <div className="text-lg font-semibold">Gira tu teléfono</div>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              El modo control funciona en horizontal.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: 0,
          bottom: 0,
          display: isLandscape ? 'block' : 'none',
        }}
      >
        {/* Video full background */}
        <div className="absolute inset-0" style={{ padding: 12 }}>
          <div
            className="h-full w-full border overflow-hidden"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="h-full" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoPlaceholder />
            </div>
          </div>
        </div>

        {/* Overlay controls */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            padding: 12,
            pointerEvents: 'none',
          }}
        >
          <div
            className="border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.00)',
              borderColor: 'rgba(255,255,255,0.00)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div
              className="flex items-end justify-between"
              style={{ gap: 12, pointerEvents: 'none' }}
            >
              <div style={{ pointerEvents: 'auto' }}>
                <VirtualJoystick
                  label="Movimiento"
                  size={170}
                  surfaceOpacity={0.55}
                  onChange={(v) => setMove(v)}
                  onEnd={() => setMove({ x: 0, y: 0 })}
                />
              </div>

              <div
                className="border"
                style={{
                  pointerEvents: 'auto',
                  backgroundColor: 'rgba(17,24,39,0.35)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: 10,
                  minWidth: 200,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border text-sm font-semibold"
                    style={{
                      backgroundColor: isTalking ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                      borderColor: isTalking ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    onPointerDown={() => setIsTalking(true)}
                    onPointerUp={() => setIsTalking(false)}
                    onPointerCancel={() => setIsTalking(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Mic size={16} />
                      Hablar
                    </span>
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border text-sm font-semibold"
                    style={{
                      backgroundColor: hornOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                      borderColor: hornOn ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    onPointerDown={() => setHornOn(true)}
                    onPointerUp={() => setHornOn(false)}
                    onPointerCancel={() => setHornOn(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Volume2 size={16} />
                      Bocina
                    </span>
                  </button>

                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border text-sm font-semibold"
                    style={{
                      backgroundColor: lightsOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                      borderColor: lightsOn ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                      color: 'rgba(255,255,255,0.92)',
                    }}
                    onClick={() => setLightsOn((v) => !v)}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Lightbulb size={16} />
                      Luces
                    </span>
                  </button>
                </div>

                <div className="mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Dir: {Math.round(move.x * 90)}° · Acel: {Math.round(-move.y * 100)}%
                </div>
              </div>

              <div style={{ pointerEvents: 'auto' }}>
                <VirtualJoystick
                  label="Cámara"
                  size={170}
                  surfaceOpacity={0.55}
                  onChange={(v) => setCam(v)}
                  onEnd={() => setCam({ x: 0, y: 0 })}
                />
              </div>
            </div>

            <div className="mt-2 text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.70)', pointerEvents: 'none' }}>
              Suelta los sticks para centrar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriveExperience() {
  const isMobile = useIsMobileLike();

  if (isMobile) {
    return <MobileControls />;
  }

  return (
    <PageShell title="Control del Robot">
      <DesktopControls />
    </PageShell>
  );
}
