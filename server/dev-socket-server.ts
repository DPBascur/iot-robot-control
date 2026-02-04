#!/usr/bin/env ts-node

import { createServer } from 'http';
import { Server } from 'socket.io';

const ROBOT_IDS = (process.env.ROBOT_IDS || 'robot-001,robot-002')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function isValidRobotId(robotId: unknown): robotId is string {
  if (typeof robotId !== 'string') return false;
  const id = robotId.trim();
  if (!id) return false;
  return ROBOT_IDS.includes(id);
}

function roomFor(robotId: string) {
  return `robot:${robotId}`;
}

const httpServer = createServer();
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').trim();
const corsOrigin = CORS_ORIGIN
  ? CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : true;

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('robot:join', (data) => {
    const robotId = (data as { robotId?: unknown } | null)?.robotId;
    if (!isValidRobotId(robotId)) {
      socket.emit('robot:error', { error: 'robotId inválido' });
      return;
    }

    // Deja el robot anterior (si tenía)
    const prev = (socket.data as { robotId?: string }).robotId;
    if (prev && prev !== robotId) socket.leave(roomFor(prev));

    (socket.data as { robotId?: string }).robotId = robotId;
    socket.join(roomFor(robotId));
    socket.emit('robot:joined', { robotId });
  });

  socket.on('robot:command', (data) => {
    const robotId = (data as { robotId?: unknown } | null)?.robotId;
    if (!isValidRobotId(robotId)) return;
    io.to(roomFor(robotId)).emit('robot:command', data);
  });

  socket.on('robot:telemetry', (data) => {
    const robotId = (data as { robotId?: unknown } | null)?.robotId;
    if (!isValidRobotId(robotId)) return;
    io.to(roomFor(robotId)).emit('robot:telemetry', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🤖 Robots permitidos: ${ROBOT_IDS.join(', ')}`);
});
