'use client';

export function SpeedChart({
  title = 'Velocidad',
  dataPoints = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  maxValue = 60,
  xLabels,
  unit = 'km/h',
}: {
  title?: string;
  dataPoints?: number[];
  maxValue?: number;
  xLabels?: string[];
  unit?: string;
}) {
  const labels = xLabels ?? Array.from({ length: dataPoints.length }, (_, i) => `${i + 1}`);

  const chartHeight = 200;
  const chartWidth = 600;
  const pointSpacing = chartWidth / Math.max(1, dataPoints.length - 1);

  const createAreaPath = (points: number[]) => {
    const path = points
      .map((point, i) => {
        const x = i * pointSpacing;
        const y = chartHeight - (point / maxValue) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
    return `${path} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
  };

  const createLinePath = (points: number[]) => {
    return points
      .map((point, i) => {
        const x = i * pointSpacing;
        const y = chartHeight - (point / maxValue) * chartHeight;
        return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');
  };

  const upperWave = dataPoints.map((p) => Math.min(maxValue, p + maxValue * 0.12));
  const lowerWave = dataPoints.map((p) => Math.max(0, p - maxValue * 0.08));

  return (
    <div
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 260ms ease-out both',
        animationDelay: '40ms',
      }}
    >
      <div className="flex items-baseline justify-between mb-6">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {unit}
        </span>
      </div>

      <div className="relative w-full h-60">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="speedArea1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-blue)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--chart-blue)" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="speedArea2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--chart-blue)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-blue)" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
            const value = Math.round(maxValue * ratio);
            return (
              <line
                key={value}
                x1="0"
                y1={chartHeight - (value / maxValue) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - (value / maxValue) * chartHeight}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.3"
              />
            );
          })}

          <path d={createAreaPath(upperWave)} fill="url(#speedArea2)" />
          <path d={createAreaPath(dataPoints)} fill="url(#speedArea1)" />
          <path d={createAreaPath(lowerWave)} fill="url(#speedArea2)" />

          <path d={createLinePath(upperWave)} fill="none" stroke="var(--chart-blue)" strokeOpacity="0.45" strokeWidth="2" />
          <path d={createLinePath(dataPoints)} fill="none" stroke="var(--chart-blue)" strokeWidth="3" />
          <path d={createLinePath(lowerWave)} fill="none" stroke="var(--chart-blue)" strokeOpacity="0.45" strokeWidth="2" />
        </svg>

        <div
          className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div
          className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {[maxValue, Math.round(maxValue * 0.8), Math.round(maxValue * 0.6), Math.round(maxValue * 0.4), Math.round(maxValue * 0.2), 0].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
