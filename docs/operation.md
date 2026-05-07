# Operación local

> Comandos para Windows + PowerShell + Docker Desktop.

## Pre-requisitos

- Node.js 20+
- npm 10+
- Docker Desktop 24+

## Variables de entorno

Copia el ejemplo y ajusta los placeholders:

```powershell
Copy-Item .env.example .env
```

Variables mínimas a personalizar:

- `MONGO_INITDB_ROOT_USERNAME` y `MONGO_INITDB_ROOT_PASSWORD`
- `JWT_SECRET` (al menos 32 caracteres)

`MONGO_URI` se compone con esos valores; dejarlo coherente.

## Arranque

```powershell
npm run install:all
npm run docker:up
npm run docker:seed
```

## Verificación

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
```

Ambos deben responder `200`. Si `/ready` no responde, revisar logs:

```powershell
npm run docker:logs
```

## Frontend

Modo desarrollo (recarga en caliente):

```powershell
npm run dev:app
```

Modo producción (servido por nginx en el contenedor `app`): `http://localhost:8080`.

## Bootstrap inicial

`npm run docker:seed` solo crea lo mínimo para entrar al sistema:

- Una **institución inicial** (código `INST-001` por defecto, configurable en `.env`).
- Un único **usuario ADMIN** (documento `admin`, password `cambiar-en-primer-login` por defecto, configurable en `.env`).
- Permisos por rol.

Con esa cuenta entras y desde la sección **Gestión** (icono ⚙ del dashboard) creas tus instituciones, unidades académicas, personas e inscripciones reales.

Para personalizar el bootstrap edita estas variables en `.env` antes del primer seed:

```env
BOOTSTRAP_INSTITUTION_CODE=UNI-MIA
BOOTSTRAP_INSTITUTION_NAME=Mi Universidad
BOOTSTRAP_INSTITUTION_CONTEXT=UNIVERSIDAD   # o SENA
ADMIN_DOCUMENTO=cc-1234567
ADMIN_NOMBRE=Tu Nombre
ADMIN_PASSWORD=algo-fuerte-aqui
```

> El seed es idempotente: si vuelves a correrlo no duplica nada, solo se asegura de que admin e institución existan.

## Detener todo

```powershell
npm run docker:down
```

El volumen `app_attendance_mongo_data` persiste entre reinicios. Para borrarlo (cuidado, datos reales del semestre):

```powershell
docker volume rm app_attendance_mongo_data
```
