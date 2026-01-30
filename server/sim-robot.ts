#!/usr/bin/env ts-node

import { io as ioClient } from 'socket.io-client';

const socket = ioClient('http://localhost:3001');

let telemetry = {
  speed: 0,
  battery: 100,
  temperature: 25
};

socket.on('connect', () => {
  console.log('🤖 Robot simulado conectado');
});

socket.on('robot:command', (data) => {
  console.log('Ejecutando comando:', data);
  // Simular cambio de velocidad
  telemetry.speed = Math.abs(data.throttle) * 0.5;
});

// Enviar telemetría cada segundo
setInterval(() => {
  telemetry.battery = Math.max(0, telemetry.battery - 0.1);
  telemetry.temperature = 25 + Math.random() * 5;
  
  socket.emit('robot:telemetry', {
    ...telemetry,
    timestamp: Date.now()
  });
}, 1000);

console.log('🤖 Robot simulado iniciado');
