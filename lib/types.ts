// Tipos compartidos entre cliente y servidor

export interface RobotCommand {
  throttle: number;  // -100 a 100
  steer: number;     // -90 a 90
  // Opcional: control de cámara (pan/tilt) y límite de potencia
  cameraPan?: number;   // -90 a 90
  cameraTilt?: number;  // -45 a 45
  maxPower?: number;    // 0 a 100
  // Auxiliares
  horn?: boolean;
  lights?: boolean;
  timestamp: number;
}

export interface TelemetryData {
  speed: number;
  battery: number;
  temperature: number;
  latitude?: number;
  longitude?: number;
  timestamp: number;
}

export interface RobotStatus {
  id: string;
  name: string;
  online: boolean;
  lastSeen: number;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'operator' | 'viewer';
}
