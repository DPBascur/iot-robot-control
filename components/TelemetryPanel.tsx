'use client';

export default function TelemetryPanel() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Velocidad:</span>
        <span className="font-mono">0 km/h</span>
      </div>
      <div className="flex justify-between">
        <span>Batería:</span>
        <span className="font-mono">100%</span>
      </div>
      <div className="flex justify-between">
        <span>Temperatura:</span>
        <span className="font-mono">25°C</span>
      </div>
      <div className="flex justify-between">
        <span>Latencia:</span>
        <span className="font-mono">-- ms</span>
      </div>
    </div>
  );
}
