'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { connectSocket } from '@/lib/socket';
import type { TelemetryData } from '@/lib/types';
import { useSelectedRobotId } from '@/lib/robotSelection';

import { BatteryCard } from '@/components/BatteryCard';
import { NetworkCard } from '@/components/NetworkCard';
import { SpeedChart } from '@/components/SpeedChart';
import { StatusCard } from '@/components/StatusCard';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatAgo(timestamp?: number) {
  if (!timestamp) return '—';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds <= 1) return 'hace 1s';
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `hace ${minutes}m`;
}

export function RobotDashboard() {
  const { robotId } = useSelectedRobotId();
  const [connected, setConnected] = useState(false);
  const [robotOnline, setRobotOnline] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 0,
    battery: 100,
    temperature: 25,
    // Evita mismatch SSR/cliente (Date.now cambia entre render server y client)
    timestamp: 0,
  });

  const [speedHistory, setSpeedHistory] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const [signalHistory, setSignalHistory] = useState<number[]>(() => Array.from({ length: 11 }, () => 0));

  const lastTelemetryRef = useRef<number>(telemetry.timestamp);

  useEffect(() => {
    // Marca OFFLINE si no llega telemetría reciente
    const interval = window.setInterval(() => {
      const last = lastTelemetryRef.current || 0;
      const recent = last > 0 && Date.now() - last <= 3500;
      setRobotOnline(connected && recent);
    }, 500);

    return () => window.clearInterval(interval);
  }, [connected]);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit('robot:join', { robotId });
    };
    const onDisconnect = () => {
      setConnected(false);
      setRobotOnline(false);
    };
    const onConnectError = () => {
      setConnected(false);
      setRobotOnline(false);
    };

    const onTelemetry = (data: TelemetryData) => {
      if (data?.robotId && data.robotId !== robotId) return;
      lastTelemetryRef.current = data.timestamp;
      setTelemetry(data);

      setSpeedHistory((prev) => {
        const next = [...prev.slice(1), clamp(data.speed, 0, 60)];
        return next;
      });

      // Señal estimada (solo visual): mapea temperatura/batería + jitter
      const estimatedSignal = clamp(35 + data.battery * 0.6 + (Math.random() * 10 - 5), 10, 100);
      setSignalHistory((prev) => {
        const next = [...prev.slice(1), estimatedSignal];
        return next;
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('robot:telemetry', onTelemetry);

    // Si ya estaba conectado y cambias de robotId, únete al room nuevo
    if (socket.connected) socket.emit('robot:join', { robotId });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('robot:telemetry', onTelemetry);
    };
  }, [robotId]);

  const xLabels = useMemo(() => Array.from({ length: speedHistory.length }, (_, i) => `${i + 1}`), [speedHistory.length]);

  const robotDetail = useMemo(() => {
    const last = lastTelemetryRef.current;
    if (!connected) return 'Sin conexión al servidor';
    return robotOnline ? `Telemetría: ${formatAgo(last)}` : `Sin telemetría: ${formatAgo(last)}`;
  }, [connected, robotOnline]);

  const networkDetail = useMemo(() => {
    const last = lastTelemetryRef.current;
    return `Actualización: ${formatAgo(last)}`;
  }, []);

  return (
    <div className="anim-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <BatteryCard
          batteryPercent={telemetry.battery}
          temperatureC={telemetry.temperature}
          updatedAt={telemetry.timestamp}
        />

        <SpeedChart title="Velocidad" dataPoints={speedHistory} maxValue={60} xLabels={xLabels} unit="km/h" />

        <NetworkCard ssid="Nombre de Red" strength={signalHistory[signalHistory.length - 1] ?? 0} bars={signalHistory} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatusCard
          title="Estado del Robot:"
          status={robotOnline ? 'ONLINE' : 'OFFLINE'}
          online={robotOnline}
          type="robot"
          detail={robotDetail}
        />
        <StatusCard
          title="Estado de Red:"
          status="Conectado"
          type="network"
          detail={networkDetail}
        />
      </div>
    </div>
  );
}
