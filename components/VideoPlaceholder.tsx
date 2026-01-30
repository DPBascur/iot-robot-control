'use client';

export default function VideoPlaceholder() {
  return (
    <div
      className="w-full aspect-video border flex items-center justify-center"
      style={{
        backgroundColor: 'var(--app-bg)',
        borderColor: 'var(--border)',
        borderRadius: 12,
      }}
    >
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Cámara (WebRTC próximamente)
      </p>
    </div>
  );
}
