#!/usr/bin/env ts-node

import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('robot:command', (data) => {
    console.log('Comando recibido:', data);
    // Reenviar al robot simulado o real
    io.emit('robot:command', data);
  });

  socket.on('robot:telemetry', (data) => {
    console.log('Telemetría recibida:', data);
    // Broadcast a todos los clientes
    io.emit('robot:telemetry', data);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
});
