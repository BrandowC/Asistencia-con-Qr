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

## Datos demo

Tras `npm run docker:seed` quedan disponibles:

| Documento     | Password   | Institución | Rol         |
| ------------- | ---------- | ----------- | ----------- |
| `DOC-DEMO-001`| `Demo.2025`| `SENA-DEMO` | INSTRUCTOR  |
| `DOC-DEMO-002`| `Demo.2025`| `UNI-DEMO`  | DOCENTE     |

Estudiantes/aprendices: `EST-DEMO-001..006`, `APR-DEMO-001..008` (sin password).

## Detener todo

```powershell
npm run docker:down
```

El volumen `app_attendance_mongo_data` persiste entre reinicios. Para borrarlo (cuidado, datos reales del semestre):

```powershell
docker volume rm app_attendance_mongo_data
```
