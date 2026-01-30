'use client';

type Status = 'online' | 'offline' | 'connecting';

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status = 'offline' }: StatusBadgeProps) {
  const statusStyles = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    connecting: 'bg-yellow-500'
  };

  const statusText = {
    online: 'En línea',
    offline: 'Desconectado',
    connecting: 'Conectando...'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${statusStyles[status]}`} />
      <span>{statusText[status]}</span>
    </div>
  );
}
