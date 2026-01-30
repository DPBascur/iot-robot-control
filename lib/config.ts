export const config = {
  robotId: process.env.NEXT_PUBLIC_ROBOT_ID || 'robot-001',
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
  webrtcConfig: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  }
};
