'use client';

export function UsersChart() {
  const barData = [
    { height: 75, value: 450 },
    { height: 55, value: 330 },
    { height: 65, value: 390 },
    { height: 80, value: 480 },
    { height: 45, value: 270 },
    { height: 100, value: 600 },
    { height: 85, value: 510 },
    { height: 90, value: 540 },
    { height: 70, value: 420 },
    { height: 60, value: 360 },
    { height: 55, value: 330 },
  ];

  return (
    <div 
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      {/* Chart Area */}
      <div
        className="p-6 mb-4"
        style={{
          backgroundColor: 'var(--users-chart-bg)',
          borderRadius: 12,
        }}
      >
        <div className="flex items-end justify-between h-32 gap-2">
          {barData.map((bar, index) => (
            <div
              key={index}
              className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
              style={{
                height: `${bar.height}%`,
                backgroundColor: 'var(--users-bar)',
              }}
              title={`${bar.value}`}
            />
          ))}
        </div>

        {/* Y-axis labels */}
        <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--users-chart-label)' }}>
          <span>0</span>
          <span>100</span>
          <span>200</span>
          <span>300</span>
          <span>400</span>
          <span>500</span>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Active Users
          </h3>
          <span className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
            (+23) than last week
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--chart-blue)' }}></div>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Users</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>32,984</span>
            <div
              className="h-1 w-16 rounded-full"
              style={{
                background: 'linear-gradient(90deg, var(--chart-blue) 0%, transparent 100%)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
