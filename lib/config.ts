export const config = {
  robotId: process.env.NEXT_PUBLIC_ROBOT_ID || 'robot-001',
  robotIds: (process.env.NEXT_PUBLIC_ROBOT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  // En producción (con Nginx) se recomienda same-origin. Si no se define,
  // el cliente Socket.IO usará la origin actual del navegador.
  socketUrl: (process.env.NEXT_PUBLIC_SOCKET_URL || '').trim(),
  webrtcConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
};

// Normaliza: si no se definió NEXT_PUBLIC_ROBOT_IDS, usa robotId como única opción.
if (!config.robotIds.length) {
  config.robotIds = [config.robotId];
}
