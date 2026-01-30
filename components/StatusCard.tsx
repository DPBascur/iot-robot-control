'use client';

interface StatusCardProps {
  title: string;
  status: string;
  online?: boolean;
  type?: 'robot' | 'network';
  detail?: string;
}

export function StatusCard({ title, status, online = true, type = 'robot', detail }: StatusCardProps) {
  const isRobot = type === 'robot';
  
  return (
    <div 
      className="p-6 border"
      style={{
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--card-shadow)',
        animation: 'fadeUp 260ms ease-out both',
        animationDelay: isRobot ? '120ms' : '160ms',
      }}
    >
      <h3 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      
      <div className="flex items-center gap-2">
        {isRobot && online && (
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#22C55E' }} />
        )}
        <span
          className="text-xl font-bold"
          style={{ color: isRobot ? '#22C55E' : '#22C55E' }}
        >
          {status}
        </span>
      </div>

      {detail && (
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {detail}
        </p>
      )}
    </div>
  );
}
