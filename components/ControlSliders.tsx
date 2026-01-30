'use client';

import { useState } from 'react';

export default function ControlSliders() {
  const [throttle, setThrottle] = useState(0);
  const [steer, setSteer] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Aceleración: {throttle}%
        </label>
        <input
          type="range"
          min="-100"
          max="100"
          value={throttle}
          onChange={(e) => setThrottle(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Dirección: {steer}°
        </label>
        <input
          type="range"
          min="-90"
          max="90"
          value={steer}
          onChange={(e) => setSteer(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
