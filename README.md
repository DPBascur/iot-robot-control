# IoT Robot Control

Aplicación web para control remoto de un robot IoT en tiempo real con telemetría y una vista de control tipo juego.

La app Next.js vive en la raíz de este repo.

## Características

- Control en tiempo real (desktop con teclado, móvil con doble joystick)
- Dashboard de telemetría (batería, velocidad, estado)
- Autenticación propia (sin NextAuth): SQLite + bcrypt + cookie firmada (HMAC) con expiración
- Roles y permisos (admin/user) + protección de rutas/APIs
- Panel Admin (CRUD de usuarios)
- Recuperación y restablecimiento de contraseña (token con expiración)
- Loader global para acciones (login, admin, perfil, etc.)
- UI con modo claro/oscuro (tema del sistema + override manual)
- Socket.IO para comunicación bidireccional
- Preparado para integrar video (placeholder por ahora)

## Estructura

```
.
├── app/                    # Rutas (App Router)
│   ├── dashboard/          # Telemetría
│   ├── drive/              # Control + cámara (mobile/desktop)
│   ├── admin/              # Admin
│   └── api/health/         # Health check
├── components/             # UI + pantallas complejas
├── lib/                    # Config, DB, auth, tipos y helpers
├── server/                 # Socket.IO dev server + robot simulado
├── styles/                 # Tokens CSS y estilos globales
└── proxy.ts                # Protección de rutas/APIs (RBAC)
```

## Requisitos

- Node.js 20.9+ (requisito de Next.js 16)

## Instalación
```bash
npm install
```

## Ejecución

Todos estos comandos se ejecutan en la raíz del repo.

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

Usa [.env.example](.env.example) como base y crea `.env.local` (o `.env`) en la raíz:

```env
NEXT_PUBLIC_ROBOT_ID=robot-001
# En Docker+Nginx (recomendado): dejar vacío para same-origin (Nginx proxya /socket.io)
# En desarrollo local sin Nginx, usa: http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=

# Recomendado (sesiones y reset de contraseña)
AUTH_SECRET=pon-aqui-un-secreto-largo-y-unico

# Opcional (seed admin si DB vacía)
DEFAULT_ADMIN_USER=admin
DEFAULT_ADMIN_PASS=admin123

# Opcional (ruta SQLite)
# SQLITE_PATH=/var/lib/iot-robot/robot.sqlite

# Email (SMTP) para recuperación de contraseña (producción)
# Puedes usar proveedores con plan gratis (Brevo/Sendinblue, Mailjet, SMTP2GO, etc.)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="IoT Robot <no-reply@tudominio.com>"
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

- Tokens CSS en [styles/globals.css](styles/globals.css)
- `next-themes` aplica el tema por clase (`.dark`)
- El toggle de tema está en el sidebar (en escritorio)

## Autenticación, roles y rutas

Esta app usa una autenticación propia (sin NextAuth):

- Usuarios en SQLite (`better-sqlite3`)
- Passwords hasheadas con `bcryptjs`
- Sesión en cookie firmada con HMAC (usa `AUTH_SECRET`) y expiración por defecto de 1 día
- RBAC (admin/user) aplicado en el middleware/proxy de la app (ver `proxy.ts`)

Rutas principales:

- `/login`: inicio de sesión
- `/dashboard`: telemetría (requiere sesión)
- `/drive`: control (requiere sesión)
- `/profile`: perfil (requiere sesión)
- `/admin`: consola admin (solo admin)

APIs principales:

- `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- `/api/admin/users` (solo admin)

## Recuperación de contraseña

Flujo:

1. Usuario solicita reset en `/forgot-password` (POST a `/api/auth/forgot-password`).
2. Se genera un token con expiración (30 min) y se guarda su **hash** en SQLite (`password_reset_tokens`).
3. Usuario abre el enlace y cambia su contraseña en `/reset-password?token=...` (POST a `/api/auth/reset-password`).

Comportamiento importante:

- En **desarrollo**, la API devuelve `resetUrl` para que puedas probar sin email.
- En **producción**, por seguridad la API **no** devuelve el token/enlace en la respuesta.
	- Si hay SMTP configurado (`SMTP_*`) y el usuario tiene `email`, el sistema envía el enlace por correo.
	- Si el usuario no tiene email, no hay forma de entregar el enlace: asigna email desde el panel admin.

### Proveedores gratis (recomendación)

Esto funciona con cualquier SMTP. Opciones típicas con plan free:

- Brevo (Sendinblue)
- Mailjet
- SMTP2GO

Nota: Gmail puede funcionar, pero suele requerir App Password y ajustes extra.

## Loader global

Hay un loader global tipo overlay (robot) para acciones de red/largas. Se controla con un provider y se usa en flows principales (login, admin, perfil, logout, etc.).