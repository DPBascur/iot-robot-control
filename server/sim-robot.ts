#!/usr/bin/env ts-node

import { io as ioClient } from 'socket.io-client';

const ROBOT_ID = (process.env.ROBOT_ID || 'robot-001').trim();
const SOCKET_URL = (process.env.SOCKET_URL || 'http://localhost:3001').trim();

const socket = ioClient(SOCKET_URL);

let telemetry = {
  speed: 0,
  battery: 100,
  temperature: 25
};

let camera = {
  pan: 0,
  tilt: 0,
};

socket.on('connect', () => {
  console.log(`🤖 Robot simulado conectado (${ROBOT_ID})`);
  socket.emit('robot:join', { robotId: ROBOT_ID, kind: 'robot' });
});

socket.on('robot:command', (data) => {
  if (data?.robotId && data.robotId !== ROBOT_ID) return;
  if (typeof data?.cameraPan === 'number') camera.pan = data.cameraPan;
  if (typeof data?.cameraTilt === 'number') camera.tilt = data.cameraTilt;

  console.log('Ejecutando comando:', {
    throttle: data?.throttle,
    steer: data?.steer,
    cameraPan: camera.pan,
    cameraTilt: camera.tilt,
    maxPower: data?.maxPower,
    horn: data?.horn,
    lights: data?.lights,
    timestamp: data?.timestamp,
  });
  // Simular cambio de velocidad
  telemetry.speed = Math.abs(data.throttle) * 0.5;
});

// Enviar telemetría cada segundo
setInterval(() => {
  telemetry.battery = Math.max(0, telemetry.battery - 0.1);
  telemetry.temperature = 25 + Math.random() * 5;
  
  socket.emit('robot:telemetry', {
    robotId: ROBOT_ID,
    ...telemetry,
    timestamp: Date.now()
  });
}, 1000);

console.log('🤖 Robot simulado iniciado');
