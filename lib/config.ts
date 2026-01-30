export const config = {
  robotId: process.env.NEXT_PUBLIC_ROBOT_ID || 'robot-001',
  // En producción (con Nginx) se recomienda same-origin. Si no se define,
  // el cliente Socket.IO usará la origin actual del navegador.
  socketUrl: (process.env.NEXT_PUBLIC_SOCKET_URL || '').trim(),
  webrtcConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
};
