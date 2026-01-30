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

## Base de datos (SQLite) y despliegue

Este proyecto usa SQLite con `better-sqlite3`. Por defecto se crea en `data/robot.sqlite` (y está ignorado por Git).

### ¿Se puede subir la DB por Git?

Técnicamente sí (es un archivo), pero NO es recomendable:

- Es un binario: no se puede mergear bien y crece rápido.
- Puede contener datos sensibles.
- Termina generando conflictos y repos pesados.

La práctica correcta es: **Git para el código**, y **la DB vive en el servidor** (o en un servicio de base de datos).

### Variables importantes (producción)

- `AUTH_SECRET`: clave para firmar/verificar la cookie de sesión. Debe ser larga y secreta.
- `SQLITE_PATH`: ruta del archivo SQLite en el servidor (opcional). Si no se define, usa `data/robot.sqlite`.
- `DEFAULT_ADMIN_USER` / `DEFAULT_ADMIN_PASS`: credenciales iniciales si la DB está vacía.

Ejemplo:

```env
AUTH_SECRET=pon-aqui-un-secreto-largo-y-unico
SQLITE_PATH=/var/lib/iot-robot/robot.sqlite
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=admin123
```

### Opción A (recomendada en VPS/Docker): el servidor crea la DB al arrancar

Al iniciar la app, se ejecutan migraciones y se hace seed del admin si no existe.

Requisitos:

- El servidor debe tener un filesystem **escribible y persistente**.
- La carpeta del `SQLITE_PATH` debe existir o poder crearse.

Ejemplo en VPS (Linux):

```bash
sudo mkdir -p /var/lib/iot-robot
sudo chown -R $USER /var/lib/iot-robot
```

Y defines `SQLITE_PATH=/var/lib/iot-robot/robot.sqlite`.

### Opción B: copiar tu archivo `robot.sqlite` al servidor (sin Git)

Si ya tienes usuarios/datos en tu máquina y quieres moverlos tal cual, copia el archivo:

- Archivo local: `data/robot.sqlite`
- Destino: la ruta configurada en `SQLITE_PATH` del servidor

Ejemplo (VPS):

```bash
scp data/robot.sqlite user@TU_SERVIDOR:/var/lib/iot-robot/robot.sqlite
```

### Opción C (Vercel/Netlify serverless): NO uses SQLite local

En serverless el disco suele ser efímero; SQLite local termina perdiéndose o fallando.
Para ese caso conviene migrar a una DB externa (Postgres/Supabase/Neon/Railway o libSQL/Turso).

Si me dices dónde lo vas a desplegar (VPS/Docker/Vercel), te dejo los pasos exactos y la configuración recomendada.

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