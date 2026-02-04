'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Crosshair, Lightbulb, Maximize2, Mic, Minimize2, Volume2, X } from 'lucide-react';

import { PageShell } from '@/components/PageShell';
import { ThemeToggle } from '@/components/ThemeToggle';
import { VirtualJoystick } from '@/components/VirtualJoystick';
import VideoPlaceholder from '@/components/VideoPlaceholder';

import { connectSocket } from '@/lib/socket';
import type { RobotCommand } from '@/lib/types';
import { useSelectedRobotId } from '@/lib/robotSelection';

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
  const [mobile, setMobile] = useState<boolean | null>(null);

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

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
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
  const { robotId } = useSelectedRobotId();
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

    const join = () => {
      socket.emit('robot:join', { robotId });
    };

    if (socket.connected) join();
    socket.on('connect', join);

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
        robotId,
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
      socket.off('connect', join);
    };
  }, [robotId]);

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
  const { setMovement, setCamera, setMaxPower, setHorn } = useRobotCommandSender();
  const { robotId } = useSelectedRobotId();
  const [throttle, setThrottle] = useState(0);
  const [steer, setSteer] = useState(0);
  const [cameraPan, setCameraPan] = useState(0);
  const [cameraTilt, setCameraTilt] = useState(0);
  const [maxPower, setMaxPowerState] = useState(70);
  const [hornOn, setHornOn] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);

  const [connected, setConnected] = useState(false);
  const [robotOnline, setRobotOnline] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<{ speed: number; battery: number; timestamp: number }>({
    speed: 0,
    battery: 100,
    timestamp: 0,
  });

  const lastTelemetryRef = useRef(0);
  const connectedRef = useRef(false);

  const maxPowerRef = useRef(70);
  const throttleRef = useRef(0);
  const steerRef = useRef(0);
  const cameraPanRef = useRef(0);
  const cameraTiltRef = useRef(0);
  const cameraSectionRef = useRef<HTMLElement | null>(null);

  const keysRef = useRef({
    w: false,
    s: false,
    a: false,
    d: false,
    up: false,
    down: false,
    left: false,
    right: false,
    i: false,
    j: false,
    k: false,
    l: false,
  });

  useEffect(() => {
    setHorn(hornOn);
  }, [hornOn, setHorn]);

  useEffect(() => {
    const onFs = () => {
      setIsCameraFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFs);
    onFs();
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    maxPowerRef.current = maxPower;
  }, [maxPower]);

  useEffect(() => {
    const centerCameraNow = () => {
      keysRef.current = { ...keysRef.current, i: false, j: false, k: false, l: false };
      cameraPanRef.current = 0;
      cameraTiltRef.current = 0;
      setCameraPan(0);
      setCameraTilt(0);
      setCamera(0, 0);
    };

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
          'i',
          'j',
          'k',
          'l',
          'I',
          'J',
          'K',
          'L',
          'h',
          'H',
          'v',
          'V',
          'n',
          'N',
          ' ',
        ].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === 'w' || e.key === 'W') keysRef.current.w = true;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = true;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = true;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = true;
      if (e.key === 'ArrowUp') keysRef.current.up = true;
      if (e.key === 'ArrowDown') keysRef.current.down = true;
      if (e.key === 'ArrowLeft') keysRef.current.left = true;
      if (e.key === 'ArrowRight') keysRef.current.right = true;
      if (e.key === 'i' || e.key === 'I') keysRef.current.i = true;
      if (e.key === 'j' || e.key === 'J') keysRef.current.j = true;
      if (e.key === 'k' || e.key === 'K') keysRef.current.k = true;
      if (e.key === 'l' || e.key === 'L') keysRef.current.l = true;
      if (e.key === 'h' || e.key === 'H') setHornOn(true);
      if (e.key === 'v' || e.key === 'V') setIsTalking(true);
      if (e.key === 'n' || e.key === 'N') centerCameraNow();
      if (e.key === ' ') {
        // stop
        keysRef.current = { w: false, s: false, a: false, d: false, up: false, down: false, left: false, right: false, i: false, j: false, k: false, l: false };
        throttleRef.current = 0;
        steerRef.current = 0;
        setThrottle(0);
        setSteer(0);
        setMovement(0, 0);
        setHornOn(false);
        setIsTalking(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W') keysRef.current.w = false;
      if (e.key === 's' || e.key === 'S') keysRef.current.s = false;
      if (e.key === 'a' || e.key === 'A') keysRef.current.a = false;
      if (e.key === 'd' || e.key === 'D') keysRef.current.d = false;
      if (e.key === 'ArrowUp') keysRef.current.up = false;
      if (e.key === 'ArrowDown') keysRef.current.down = false;
      if (e.key === 'ArrowLeft') keysRef.current.left = false;
      if (e.key === 'ArrowRight') keysRef.current.right = false;
      if (e.key === 'i' || e.key === 'I') keysRef.current.i = false;
      if (e.key === 'j' || e.key === 'J') keysRef.current.j = false;
      if (e.key === 'k' || e.key === 'K') keysRef.current.k = false;
      if (e.key === 'l' || e.key === 'L') keysRef.current.l = false;
      if (e.key === 'h' || e.key === 'H') setHornOn(false);
      if (e.key === 'v' || e.key === 'V') setIsTalking(false);
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);

    let raf = 0;
    const loop = () => {
      const k = keysRef.current;

      // Potenciómetro
      setMaxPower(maxPowerRef.current);

      // target values (movimiento)
      const upPressed = k.w || k.up;
      const downPressed = k.s || k.down;
      const leftPressed = k.a || k.left;
      const rightPressed = k.d || k.right;

      const targetThrottle = upPressed ? 100 : downPressed ? -60 : 0;
      const targetSteer = leftPressed ? -80 : rightPressed ? 80 : 0;

      // smooth approach
      const nextThrottle = Math.abs(throttleRef.current + (targetThrottle - throttleRef.current) * 0.18) < 0.6
        ? 0
        : throttleRef.current + (targetThrottle - throttleRef.current) * 0.18;
      const nextSteer = Math.abs(steerRef.current + (targetSteer - steerRef.current) * 0.22) < 0.6
        ? 0
        : steerRef.current + (targetSteer - steerRef.current) * 0.22;

      throttleRef.current = nextThrottle;
      steerRef.current = nextSteer;

      setThrottle(nextThrottle);
      setSteer(nextSteer);

      // Movimiento del robot: siempre vuelve a 0 al soltar
      setMovement(nextThrottle, nextSteer);

      // Cámara: I/J/K/L, persistente (no vuelve al centro)
      const panDir = (k.j ? -1 : 0) + (k.l ? 1 : 0);
      const tiltDir = (k.i ? 1 : 0) + (k.k ? -1 : 0);
      if (panDir !== 0 || tiltDir !== 0) {
        const panSpeed = 1.25; // grados por frame aprox ("hold" para mover)
        const tiltSpeed = 0.95;
        const nextPan = clamp(cameraPanRef.current + panDir * panSpeed, -90, 90);
        const nextTilt = clamp(cameraTiltRef.current + tiltDir * tiltSpeed, -45, 45);
        if (nextPan !== cameraPanRef.current || nextTilt !== cameraTiltRef.current) {
          cameraPanRef.current = nextPan;
          cameraTiltRef.current = nextTilt;
          setCameraPan(nextPan);
          setCameraTilt(nextTilt);
          setCamera(nextPan, nextTilt);
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(raf);
      setMovement(0, 0);
      setHornOn(false);
      setIsTalking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMovement, setCamera, setMaxPower]);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      connectedRef.current = true;
      socket.emit('robot:join', { robotId });
    };
    const onDisconnect = () => {
      setConnected(false);
      connectedRef.current = false;
      setRobotOnline(false);
    };
    const onConnectError = () => {
      setConnected(false);
      connectedRef.current = false;
      setRobotOnline(false);
    };

    const onTelemetry = (data: any) => {
      if (data?.robotId && data.robotId !== robotId) return;
      if (typeof data?.speed !== 'number' || typeof data?.battery !== 'number' || typeof data?.timestamp !== 'number') {
        return;
      }
      lastTelemetryRef.current = data.timestamp;
      setTelemetry({ speed: data.speed, battery: data.battery, timestamp: data.timestamp });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('robot:telemetry', onTelemetry);

    if (socket.connected) onConnect();

    const interval = window.setInterval(() => {
      const last = lastTelemetryRef.current || 0;
      const recent = last > 0 && Date.now() - last <= 3500;
      setRobotOnline(connectedRef.current && recent);

      const p = (socket as any)?.io?.engine?.ping;
      setPingMs(typeof p === 'number' && Number.isFinite(p) ? Math.round(p) : null);
    }, 500);

    return () => {
      window.clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('robot:telemetry', onTelemetry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robotId]);

  const stopNow = () => {
    keysRef.current = { w: false, s: false, a: false, d: false, up: false, down: false, left: false, right: false, i: false, j: false, k: false, l: false };
    throttleRef.current = 0;
    steerRef.current = 0;
    setThrottle(0);
    setSteer(0);
    setMovement(0, 0);
    setHornOn(false);
    setIsTalking(false);
  };

  const centerCamera = () => {
    keysRef.current = { ...keysRef.current, i: false, j: false, k: false, l: false };
    cameraPanRef.current = 0;
    cameraTiltRef.current = 0;
    setCameraPan(0);
    setCameraTilt(0);
    setCamera(0, 0);
  };

  const toggleCameraFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      const el = cameraSectionRef.current as any;
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {
      // ignore
    }
  };

  const accelValue = Math.round(throttle);
  const accelBar = clamp(Math.max(0, throttle), 0, 100);
  const steerValue = Math.round(steer);

  const speedValue = Number.isFinite(telemetry.speed) ? telemetry.speed : 0;
  const batteryValue = clamp(Number.isFinite(telemetry.battery) ? telemetry.battery : 0, 0, 100);
  const pingLabel = pingMs !== null ? `${pingMs} ms` : '— ms';

  // Dirección: -90..90 -> 0..1 (arco semicircular)
  const steerNorm = (clamp(steer, -90, 90) + 90) / 180;
  const arcRadius = 120;
  const arcCirc = Math.PI * arcRadius;
  const arcDash = arcCirc * steerNorm;

  // Cámara (pan): -90..90 -> 0..1
  const cameraPanValue = Math.round(cameraPan);
  const cameraTiltValue = Math.round(cameraTilt);
  const camNorm = (clamp(cameraPan, -90, 90) + 90) / 180;
  const camDash = arcCirc * camNorm;

  // Cámara (tilt/Y): -45..45 -> 0..1
  const tiltNorm = (clamp(cameraTilt, -45, 45) + 45) / 90;
  const tiltDash = arcCirc * tiltNorm;

  // Velocidad: 0..60 km/h -> 0..1
  const speedMax = 60;
  const speedNorm = clamp(speedValue / speedMax, 0, 1);
  const speedDash = arcCirc * speedNorm;

  // Aceleración (magnitud): 0..100 -> 0..1
  const accelAbsFs = clamp(Math.abs(throttle), 0, 100);
  const accelNormFs = accelAbsFs / 100;
  const accelDashFs = arcCirc * accelNormFs;
  const accelIsReverse = throttle < 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Video / Cámara */}
      <section
        ref={cameraSectionRef as any}
        className="xl:col-span-8 border overflow-hidden relative"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
          minHeight: 420,
          animation: 'fadeUp 240ms ease-out both',
        }}
      >
        <div className="absolute inset-0" style={{ opacity: 0.95 }}>
          <VideoPlaceholder fill />
        </div>

        {/* HUD */}
        <div
          className="absolute left-4 right-4 top-4 flex items-center justify-between"
          style={{
            gap: 12,
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
            style={{
              backgroundColor: 'rgba(17,24,39,0.35)',
              borderColor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'rgba(255,255,255,0.92)',
              pointerEvents: 'none',
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: robotOnline ? 'var(--accent-green)' : 'rgba(148,163,184,0.9)' }}
            />
            <span className="text-xs font-bold" style={{ letterSpacing: 0.6 }}>
              {robotOnline ? 'ONLINE' : connected ? 'SIN TELEMETRÍA' : 'OFFLINE'}
            </span>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
              {robotId}
            </span>
          </div>

          <div
            className="inline-flex items-center gap-4 px-3 py-2 rounded-xl border"
            style={{
              backgroundColor: 'rgba(17,24,39,0.35)',
              borderColor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'rgba(255,255,255,0.92)',
              pointerEvents: 'auto',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-20 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${batteryValue}%`,
                    backgroundColor: batteryValue > 20 ? 'var(--accent-green)' : 'var(--danger)',
                  }}
                />
              </div>
              <span className="text-xs font-bold">{Math.round(batteryValue)}%</span>
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.80)' }}>
              {pingLabel}
            </div>

            <button
              type="button"
              className="p-2 rounded-lg border"
              aria-label={hornOn ? 'Bocina activada (H)' : 'Bocina (H)'}
              style={{
                backgroundColor: hornOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.06)',
                borderColor: hornOn ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.92)',
              }}
              onPointerDown={() => setHornOn(true)}
              onPointerUp={() => setHornOn(false)}
              onPointerCancel={() => setHornOn(false)}
              onPointerLeave={() => setHornOn(false)}
            >
              <Volume2 size={16} />
            </button>

            <button
              type="button"
              className="p-2 rounded-lg border"
              aria-label={isTalking ? 'Hablando (V)' : 'Hablar (V)'}
              style={{
                backgroundColor: isTalking ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.06)',
                borderColor: isTalking ? 'rgba(34,197,94,0.40)' : 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.92)',
              }}
              onPointerDown={() => setIsTalking(true)}
              onPointerUp={() => setIsTalking(false)}
              onPointerCancel={() => setIsTalking(false)}
              onPointerLeave={() => setIsTalking(false)}
            >
              <Mic size={16} />
            </button>

            <button
              type="button"
              onClick={toggleCameraFullscreen}
              className="p-2 rounded-lg border"
              aria-label={isCameraFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.92)',
              }}
            >
              {isCameraFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Ayuda / atajos (overlay, no ocupa layout). Se oculta en fullscreen */}
        {!isCameraFullscreen && (
          <div
            className="absolute left-4 bottom-4 border rounded-2xl px-3 py-2"
            style={{
              backgroundColor: 'rgba(17,24,39,0.35)',
              borderColor: 'rgba(255,255,255,0.14)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              color: 'rgba(255,255,255,0.92)',
              pointerEvents: 'none',
              maxWidth: 360,
            }}
          >
            <div className="text-[11px] font-bold" style={{ letterSpacing: 0.8, color: 'rgba(255,255,255,0.78)' }}>
              CONTROLES
            </div>
            <div className="mt-1 text-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>
              W/S acel/reversa · A/D dirección
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>
              I/J/K/L cámara · N centrar · H bocina · V hablar
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
              Espacio = STOP
            </div>
          </div>
        )}

        {/* HUD extra solo en fullscreen */}
        {isCameraFullscreen && (
          <div
            className="absolute left-4 right-4 bottom-4"
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              pointerEvents: 'none',
            }}
          >
            <div
              className="border rounded-2xl px-3 py-2"
              style={{
                backgroundColor: 'rgba(17,24,39,0.35)',
                borderColor: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.92)',
                width: 260,
                maxWidth: '48%',
              }}
            >
              <div className="text-[11px] font-bold" style={{ letterSpacing: 0.8, color: 'rgba(255,255,255,0.78)' }}>
                VELOCIDAD
              </div>
              <div className="mt-1">
                <svg viewBox="0 0 320 180" width="100%" height="auto">
                  <defs>
                    <linearGradient id="speedFsGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(37,99,235,0.55)" />
                      <stop offset="100%" stopColor="rgba(37,99,235,0.95)" />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 40 160 A 120 120 0 0 1 280 160"
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 160 A 120 120 0 0 1 280 160"
                    fill="none"
                    stroke="url(#speedFsGrad)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray={`${speedDash} ${arcCirc - speedDash}`}
                  />

                  <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="800" fill="rgba(255,255,255,0.95)">
                    {speedValue.toFixed(1).replace('.', ',')}
                  </text>
                  <text x="160" y="145" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.72)">
                    km/h
                  </text>
                </svg>
              </div>
            </div>

            <div
              className="border rounded-2xl px-3 py-2"
              style={{
                backgroundColor: 'rgba(17,24,39,0.35)',
                borderColor: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                color: 'rgba(255,255,255,0.92)',
                width: 260,
                maxWidth: '48%',
              }}
            >
              <div className="text-[11px] font-bold" style={{ letterSpacing: 0.8, color: 'rgba(255,255,255,0.78)' }}>
                {accelIsReverse ? 'REVERSA' : 'ACELERACIÓN'}
              </div>
              <div className="mt-1">
                <svg viewBox="0 0 320 180" width="100%" height="auto">
                  <defs>
                    <linearGradient id="accelFsGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={accelIsReverse ? 'rgba(245,158,11,0.55)' : 'rgba(34,197,94,0.55)'} />
                      <stop offset="100%" stopColor={accelIsReverse ? 'rgba(245,158,11,0.95)' : 'rgba(34,197,94,0.95)'} />
                    </linearGradient>
                  </defs>

                  <path
                    d="M 40 160 A 120 120 0 0 1 280 160"
                    fill="none"
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 40 160 A 120 120 0 0 1 280 160"
                    fill="none"
                    stroke="url(#accelFsGrad)"
                    strokeWidth="18"
                    strokeLinecap="round"
                    strokeDasharray={`${accelDashFs} ${arcCirc - accelDashFs}`}
                  />

                  <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="800" fill="rgba(255,255,255,0.95)">
                    {Math.round(throttle)}%
                  </text>
                  <text x="160" y="145" textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.72)">
                    magnitud {Math.round(accelAbsFs)}%
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Right sidebar */}
      <aside className="xl:col-span-4 space-y-4" style={{ animation: 'fadeUp 240ms ease-out both', animationDelay: '60ms' }}>
        <section
          className="p-5 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aceleración
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {accelValue}%
            </div>
          </div>
          <div className="mt-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(148,163,184,0.20)' }}>
            <div
              className="h-3 rounded-full"
              style={{
                width: `${accelBar}%`,
                background: 'linear-gradient(90deg, rgba(34,197,94,0.65), rgba(34,197,94,0.95))',
              }}
            />
          </div>
        </section>

        <section
          className="p-5 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Dirección
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {steerValue}°
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Cámara: {cameraPanValue}° / {cameraTiltValue}°
            </div>
            <button
              type="button"
              onClick={centerCamera}
              className="px-3 py-2 rounded-lg border text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(148,163,184,0.24)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Crosshair size={14} />
                Centrar (N)
              </span>
            </button>
          </div>
        </section>

        <section
          className="p-5 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Velocidad
            </div>
            <div className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
              0–{speedMax} km/h
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div style={{ width: 260, maxWidth: '100%' }}>
              <svg viewBox="0 0 320 180" width="100%" height="auto">
                <defs>
                  <linearGradient id="speedGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(37,99,235,0.55)" />
                    <stop offset="100%" stopColor="rgba(37,99,235,0.95)" />
                  </linearGradient>
                </defs>

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="url(#speedGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${speedDash} ${arcCirc - speedDash}`}
                />

                <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="700" fill="var(--text-primary)">
                  {speedValue.toFixed(1).replace('.', ',')}
                </text>
                <text x="160" y="145" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                  km/h
                </text>
              </svg>
            </div>
          </div>
        </section>

        <section
          className="p-5 border"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Status
          </div>
          <div className="mt-3 flex items-start gap-3">
            <span
              className="mt-1 inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: robotOnline ? 'var(--accent-green)' : 'rgba(148,163,184,0.9)' }}
            />
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Socket {connected ? 'conectado' : 'desconectado'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Última telemetría: {telemetry.timestamp ? `${Math.round((Date.now() - telemetry.timestamp) / 1000)}s` : '—'}
              </div>
            </div>
          </div>
        </section>
      </aside>

      {/* Bottom: Power + STOP */}
      <section
        className="xl:col-span-4 border p-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
          animation: 'fadeUp 240ms ease-out both',
          animationDelay: '100ms',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Potencia
          </div>
          <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {maxPower}%
          </div>
        </div>

        <div className="mt-4 flex items-center gap-5">
          <div className="flex-1">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              Potenciómetro
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={maxPower}
              onChange={(e) => setMaxPowerState(Number(e.target.value))}
              className="w-full"
              style={{
                height: 170,
                width: 40,
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
              } as any}
            />
          </div>

          <button
            type="button"
            onClick={stopNow}
            className="px-6 py-4 rounded-xl font-extrabold tracking-wide border"
            style={{
              backgroundColor: 'rgba(220,38,38,0.95)',
              borderColor: 'rgba(0,0,0,0.12)',
              color: 'white',
              boxShadow: '0 16px 30px rgba(220,38,38,0.22)',
              minWidth: 150,
            }}
          >
            STOP
          </button>
        </div>
      </section>

      {/* Bottom: Direction + Camera direction */}
      <section
        className="xl:col-span-8 border p-5"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--card-shadow)',
          animation: 'fadeUp 240ms ease-out both',
          animationDelay: '120ms',
        }}
      >
        <div className="flex items-center justify-between" style={{ gap: 12 }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Dirección
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Cámara (pan)
          </div>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Cámara (tilt)
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center justify-center">
            <div style={{ width: 320, maxWidth: '100%' }}>
              <svg viewBox="0 0 320 180" width="100%" height="auto">
                <defs>
                  <linearGradient id="steerGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.65)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0.95)" />
                  </linearGradient>
                </defs>

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="url(#steerGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${arcDash} ${arcCirc - arcDash}`}
                />

                <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="700" fill="var(--text-primary)">
                  {steerValue}°
                </text>
                <text x="160" y="145" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                  -90 · 0 · 90
                </text>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ width: 320, maxWidth: '100%' }}>
              <svg viewBox="0 0 320 180" width="100%" height="auto">
                <defs>
                  <linearGradient id="camGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(168,85,247,0.55)" />
                    <stop offset="100%" stopColor="rgba(168,85,247,0.95)" />
                  </linearGradient>
                </defs>

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="url(#camGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${camDash} ${arcCirc - camDash}`}
                />

                <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="700" fill="var(--text-primary)">
                  {cameraPanValue}°
                </text>
                <text x="160" y="145" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                  -90 · 0 · 90 · tilt {cameraTiltValue}°
                </text>
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div style={{ width: 320, maxWidth: '100%' }}>
              <svg viewBox="0 0 320 180" width="100%" height="auto">
                <defs>
                  <linearGradient id="tiltGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(14,165,233,0.55)" />
                    <stop offset="100%" stopColor="rgba(14,165,233,0.95)" />
                  </linearGradient>
                </defs>

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth="18"
                  strokeLinecap="round"
                />

                <path
                  d="M 40 160 A 120 120 0 0 1 280 160"
                  fill="none"
                  stroke="url(#tiltGrad)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  strokeDasharray={`${tiltDash} ${arcCirc - tiltDash}`}
                />

                <text x="160" y="120" textAnchor="middle" fontSize="42" fontWeight="700" fill="var(--text-primary)">
                  {cameraTiltValue}°
                </text>
                <text x="160" y="145" textAnchor="middle" fontSize="12" fill="var(--text-secondary)">
                  -45 · 0 · 45
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileControls() {
  const { setMovement, setCamera, setMaxPower, setHorn, setLights } = useRobotCommandSender();
  const { robotId } = useSelectedRobotId();
  const isLandscape = useLandscapeRequired(true);
  const [move, setMove] = useState({ x: 0, y: 0 });
  const [cam, setCam] = useState({ x: 0, y: 0 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [hornOn, setHornOn] = useState(false);
  const [lightsOn, setLightsOn] = useState(false);
  const [maxPower, setMaxPowerState] = useState(100);
  const [joystickSize, setJoystickSize] = useState(160);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const minSide = Math.min(w, h);
      // iPhone horizontal suele tener poca altura: mantenemos sticks compactos
      const size = clamp(Math.round(minSide * 0.36), 110, 150);
      setJoystickSize(size);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const [connected, setConnected] = useState(false);
  const [robotOnline, setRobotOnline] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [telemetry, setTelemetry] = useState<{ speed: number; battery: number; timestamp: number }>({
    speed: 0,
    battery: 100,
    timestamp: 0,
  });

  const lastTelemetryRef = useRef(0);
  const connectedRef = useRef(false);

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

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      connectedRef.current = true;
      socket.emit('robot:join', { robotId });
    };
    const onDisconnect = () => {
      setConnected(false);
      connectedRef.current = false;
      setRobotOnline(false);
    };
    const onConnectError = () => {
      setConnected(false);
      connectedRef.current = false;
      setRobotOnline(false);
    };

    const onTelemetry = (data: any) => {
      if (data?.robotId && data.robotId !== robotId) return;
      if (typeof data?.speed !== 'number' || typeof data?.battery !== 'number' || typeof data?.timestamp !== 'number') {
        return;
      }
      lastTelemetryRef.current = data.timestamp;
      setTelemetry({ speed: data.speed, battery: data.battery, timestamp: data.timestamp });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('robot:telemetry', onTelemetry);

    if (socket.connected) onConnect();

    const interval = window.setInterval(() => {
      const last = lastTelemetryRef.current || 0;
      const recent = last > 0 && Date.now() - last <= 3500;
      setRobotOnline(connectedRef.current && recent);

      const p = (socket as any)?.io?.engine?.ping;
      setPingMs(typeof p === 'number' && Number.isFinite(p) ? Math.round(p) : null);
    }, 500);

    return () => {
      window.clearInterval(interval);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('robot:telemetry', onTelemetry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [robotId]);

  const speedValue = Number.isFinite(telemetry.speed) ? telemetry.speed : 0;
  const batteryValue = clamp(Number.isFinite(telemetry.battery) ? telemetry.battery : 0, 0, 100);
  const pingLabel = pingMs !== null ? `${pingMs} ms` : '— ms';

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Pestañita / panel superior (no reserva espacio) */}
      {isLandscape && (
        <div
          className="absolute left-0 right-0 top-0"
          style={{
            paddingTop: 'calc(10px + env(safe-area-inset-top))',
            paddingLeft: 'calc(10px + env(safe-area-inset-left))',
            paddingRight: 'calc(10px + env(safe-area-inset-right))',
            paddingBottom: 10,
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <div className="relative">
            {/* Estado (esquina superior izquierda) */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                pointerEvents: 'none',
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'rgba(17,24,39,0.55)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: robotOnline ? 'var(--accent-green)' : 'rgba(148,163,184,0.9)',
                  }}
                />
                <span className="text-xs font-bold" style={{ letterSpacing: 0.5 }}>
                  {robotOnline ? 'ONLINE' : connected ? 'SIN TELEMETRÍA' : 'OFFLINE'}
                </span>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  {robotId}
                </span>
              </div>
            </div>

            {/* Batería/velocidad/ping (esquina superior derecha) */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                pointerEvents: 'none',
              }}
            >
              <div
                className="inline-flex items-center gap-3 px-3 py-2 rounded-xl border"
                style={{
                  backgroundColor: 'rgba(17,24,39,0.55)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${batteryValue}%`,
                        backgroundColor: batteryValue > 20 ? 'var(--accent-green)' : 'var(--danger)',
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold">{Math.round(batteryValue)}%</span>
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.80)' }}>
                  {speedValue.toFixed(1).replace('.', ',')} km/h
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>
                  {pingLabel}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              {!panelOpen ? (
                <button
                  type="button"
                  onClick={() => setPanelOpen(true)}
                  className="px-4 py-2 rounded-full border text-sm font-semibold pressable"
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
                  className="border anim-slide-down"
                  style={{
                    pointerEvents: 'auto',
                    backgroundColor: 'rgba(17,24,39,0.72)',
                    borderColor: 'rgba(255,255,255,0.18)',
                    borderRadius: 16,
                    padding: 10,
                    width: 'min(520px, 100%)',
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
          </div>
        </div>
      )}

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

            <div className="mt-4 flex justify-center">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg border text-sm font-semibold pressable"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                Volver
              </Link>
            </div>
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
        <div
          className="absolute inset-0"
          style={{
            paddingTop: 'calc(12px + env(safe-area-inset-top))',
            paddingLeft: 12,
            paddingRight: 12,
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          }}
        >
          <div
            className="h-full w-full border overflow-hidden"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="relative h-full">
              <div className="absolute inset-0" style={{ opacity: 0.95 }}>
                <VideoPlaceholder fill />
              </div>

              {/* HUD móvil (similar al cockpit) */}
              {/* HUD se mueve al contenedor superior para alinear con Control */}

              {/* Vignette suave */}
              <div
                className="absolute inset-0"
                style={{
                  pointerEvents: 'none',
                  background: 'radial-gradient(70% 70% at 50% 30%, rgba(0,0,0,0.00), rgba(0,0,0,0.25))',
                }}
              />
            </div>
          </div>
        </div>

        {/* Overlay controls: grid inferior sin solapes */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            paddingLeft: 'calc(12px + env(safe-area-inset-left))',
            paddingRight: 'calc(12px + env(safe-area-inset-right))',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
            paddingTop: 12,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto minmax(170px, 280px) auto',
              gap: 12,
              alignItems: 'end',
            }}
          >
            <div style={{ pointerEvents: 'auto', justifySelf: 'start' }}>
              <VirtualJoystick
                label="Movimiento"
                size={joystickSize}
                surfaceOpacity={0.55}
                onChange={(v) => setMove(v)}
                onEnd={() => setMove({ x: 0, y: 0 })}
              />
            </div>

            <div
              className="border anim-fade-up"
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'rgba(17,24,39,0.42)',
                borderColor: 'rgba(255,255,255,0.14)',
                borderRadius: 16,
                padding: 10,
                width: '100%',
                overflow: 'hidden',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                justifySelf: 'center',
              }}
            >
              <div className="grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border text-xs font-semibold pressable"
                  style={{
                    backgroundColor: isTalking ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                    borderColor: isTalking ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                    color: 'rgba(255,255,255,0.92)',
                    whiteSpace: 'nowrap',
                  }}
                  onPointerDown={() => setIsTalking(true)}
                  onPointerUp={() => setIsTalking(false)}
                  onPointerCancel={() => setIsTalking(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Mic size={16} />
                    Hablar
                  </span>
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border text-xs font-semibold pressable"
                  style={{
                    backgroundColor: hornOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                    borderColor: hornOn ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                    color: 'rgba(255,255,255,0.92)',
                    whiteSpace: 'nowrap',
                  }}
                  onPointerDown={() => setHornOn(true)}
                  onPointerUp={() => setHornOn(false)}
                  onPointerCancel={() => setHornOn(false)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Volume2 size={16} />
                    Bocina
                  </span>
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border text-xs font-semibold pressable"
                  style={{
                    backgroundColor: lightsOn ? 'rgba(34,197,94,0.22)' : 'rgba(255,255,255,0.10)',
                    borderColor: lightsOn ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.16)',
                    color: 'rgba(255,255,255,0.92)',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setLightsOn((v) => !v)}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Lightbulb size={16} />
                    Luces
                  </span>
                </button>
              </div>

              <div className="mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Dir: {Math.round(move.x * 90)}° · Acel: {Math.round(-move.y * 100)}% · Suelta para centrar
              </div>
            </div>

            <div style={{ pointerEvents: 'auto', justifySelf: 'end' }}>
              <VirtualJoystick
                label="Cámara"
                size={joystickSize}
                surfaceOpacity={0.55}
                onChange={(v) => setCam(v)}
                onEnd={() => setCam({ x: 0, y: 0 })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DriveExperience() {
  const mounted = useMounted();
  const isMobile = useIsMobileLike();

  // Importante: este componente es Client Component pero Next puede pre-renderizar HTML.
  // Si el SSR renderiza Desktop y el cliente decide Mobile (o viceversa), React avisa de hydration mismatch.
  // Renderizamos un fallback estable hasta conocer el viewport real del cliente.
  if (!mounted || isMobile === null) {
    return (
      <div
        className="fixed inset-0 grid place-items-center anim-fade-in"
        style={{
          backgroundColor: 'var(--app-bg)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="h-9 w-9 rounded-full border-2 reduce-motion-spin"
          style={{
            borderColor: 'var(--border)',
            borderTopColor: 'var(--accent-green)',
            animation: 'authSpin 900ms linear infinite',
          }}
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (isMobile) return <MobileControls />;

  return (
    <PageShell title="Control del Robot">
      <DesktopControls />
    </PageShell>
  );
}
