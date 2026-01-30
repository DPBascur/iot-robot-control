# IoT Robot Control

Aplicación web para control remoto de un robot IoT en tiempo real con telemetría y una vista de control tipo juego.

La app Next.js vive en la carpeta [iot-robot-control/](iot-robot-control).

## Características

- Control en tiempo real (desktop con teclado, móvil con doble joystick)
- Dashboard de telemetría (batería, velocidad, estado)
- UI con modo claro/oscuro (tema del sistema + override manual)
- Socket.IO para comunicación bidireccional
- Preparado para integrar video (placeholder por ahora)

## Estructura

La app está dentro de [iot-robot-control/](iot-robot-control):

```
iot-robot-control/
├── app/                    # Rutas (App Router)
│   ├── dashboard/          # Telemetría
│   ├── drive/              # Control + cámara (mobile/desktop)
│   ├── admin/              # Admin
│   └── api/health/         # Health check
├── components/             # UI + pantallas complejas
├── lib/                    # Config, tipos y socket client
├── server/                 # Socket.IO dev server + robot simulado
└── styles/                 # Tokens CSS y estilos globales
```

## Requisitos

- Node.js 20.9+ (requisito de Next.js 16)

## Instalación

Desde la carpeta de la app:

```bash
cd iot-robot-control
npm install
```

## Ejecución

Todos estos comandos se ejecutan dentro de [iot-robot-control/](iot-robot-control).

### Desarrollo (solo Next.js)

```bash
npm run dev
```

### Servidor Socket.IO (puerto 3001)

```bash
npm run socket
```

### Robot simulado (emite telemetría cada 1s)

```bash
npm run robot
```

### Todo junto

El script `dev:all` usa `concurrently`. Si no lo tienes instalado:

```bash
npm install -D concurrently
npm run dev:all
```

## URLs

- Frontend: http://localhost:3000
- Socket.IO: http://localhost:3001
- Health check: http://localhost:3000/api/health

## Variables de entorno

Crea [iot-robot-control/.env.local](iot-robot-control/.env.local):

```env
NEXT_PUBLIC_ROBOT_ID=robot-001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## Arquitectura (resumen)

El sistema se divide en 3 piezas:

- Frontend Next.js: UI, dashboard y control
- Servidor Socket.IO (dev): bridge/broadcast de eventos
- Robot simulado: reacciona a comandos y publica telemetría

### Eventos Socket.IO

- `robot:command`: comandos desde el control hacia el robot/clients
- `robot:telemetry`: telemetría desde robot hacia el dashboard

### Tipos principales

`RobotCommand` (cliente → server):

- `throttle`: -100..100
- `steer`: -90..90
- `cameraPan?`: -90..90
- `cameraTilt?`: -45..45
- `maxPower?`: 0..100
- `horn?`: boolean
- `lights?`: boolean
- `timestamp`: number

`TelemetryData` (robot → server → cliente):

- `speed`: number
- `battery`: number
- `temperature`: number
- `latitude?`, `longitude?`: number
- `timestamp`: number

## Theming (claro/oscuro)

- Tokens CSS en [iot-robot-control/styles/globals.css](iot-robot-control/styles/globals.css)
- `next-themes` aplica el tema por clase (`.dark`)
- El toggle de tema está en el sidebar (en escritorio)