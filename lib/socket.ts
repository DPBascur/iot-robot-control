import { io, Socket } from 'socket.io-client';
import { config } from './config';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const base = config.socketUrl;
    socket = (base ? io(base, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    }) : io({
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    }));
  }
  return socket;
};

export const connectSocket = () => {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};
