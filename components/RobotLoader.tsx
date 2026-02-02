'use client';

type Props = {
  label?: string;
  fullscreen?: boolean;
};

export function RobotLoader({ label = 'Cargando…', fullscreen = true }: Props) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    fullscreen ? (
      <div
        className="fixed inset-0 z-50 grid place-items-center"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--app-bg) 92%, black 8%)',
          backdropFilter: 'blur(6px)',
        }}
      >
        {children}
      </div>
    ) : (
      <div className="grid place-items-center py-10">{children}</div>
    );

  return (
    <Wrapper>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-24 h-24">
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-20 h-3 rounded-full blur-[2px] opacity-20"
            style={{ backgroundColor: 'var(--text-primary)' }}
          />

          <div
            className="absolute left-1/2 -translate-x-1/2 top-6 w-20 h-14 rounded-2xl border"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border)',
              boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
            }}
          />

          <div
            className="absolute left-1/2 -translate-x-1/2 top-1 w-16 h-10 rounded-2xl border flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
          >
            <span className="robot-eye" />
            <span className="robot-eye" />
          </div>

          <div
            className="absolute left-1/2 -translate-x-1/2 -top-1 w-1 h-4 rounded-full"
            style={{ backgroundColor: 'var(--border)' }}
          />
          <div className="absolute left-1/2 -translate-x-1/2 -top-4 w-3 h-3 rounded-full robot-ping" />

          <div className="absolute left-0 top-9 w-6 h-2 rounded-full robot-arm-left" />
          <div className="absolute right-0 top-9 w-6 h-2 rounded-full robot-arm-right" />

          <div className="absolute left-4 bottom-2 w-4 h-4 rounded-full robot-wheel" />
          <div className="absolute right-4 bottom-2 w-4 h-4 rounded-full robot-wheel" />

          <div className="absolute inset-0 robot-bounce" />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Preparando sistema…
          </p>
        </div>
      </div>
    </Wrapper>
  );
}
