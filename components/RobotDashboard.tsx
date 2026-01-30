'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { connectSocket } from '@/lib/socket';
import type { TelemetryData } from '@/lib/types';

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
  const [connected, setConnected] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speed: 0,
    battery: 100,
    temperature: 25,
    timestamp: Date.now(),
  });

  const [speedHistory, setSpeedHistory] = useState<number[]>(() => Array.from({ length: 12 }, () => 0));
  const [signalHistory, setSignalHistory] = useState<number[]>(() => Array.from({ length: 11 }, () => 0));

  const lastTelemetryRef = useRef<number>(telemetry.timestamp);

  useEffect(() => {
    const socket = connectSocket();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onConnectError = () => setConnected(false);

    const onTelemetry = (data: TelemetryData) => {
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

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('robot:telemetry', onTelemetry);
    };
  }, []);

  const xLabels = useMemo(() => Array.from({ length: speedHistory.length }, (_, i) => `${i + 1}`), [speedHistory.length]);

  const robotDetail = useMemo(() => {
    const last = lastTelemetryRef.current;
    return connected ? `Última telemetría: ${formatAgo(last)}` : 'Sin conexión al servidor';
  }, [connected]);

  const networkDetail = useMemo(() => {
    const last = lastTelemetryRef.current;
    return `Actualización: ${formatAgo(last)}`;
  }, []);

  return (
    <>
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
          status={connected ? 'ONLINE' : 'OFFLINE'}
          online={connected}
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
    </>
  );
}
