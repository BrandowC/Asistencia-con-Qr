# Contrato API

Todos los endpoints retornan JSON con la forma `{ "data": ... }` para éxito, o `{ "error": { ... } }` para falla.

Base URL local: `http://localhost:4000`.

## Salud

| Método | Ruta      | Descripción                          |
| ------ | --------- | ------------------------------------ |
| GET    | `/health` | Estado del servicio.                 |
| GET    | `/ready`  | 200 si Mongo está conectado.         |

## Autenticación

### POST `/api/auth/login`

```json
{
  "documento": "DOC-DEMO-001",
  "password": "Demo.2025",
  "institutionCode": "SENA-DEMO"
}
```

**200**:
```json
{
  "data": {
    "token": "<jwt-demo>",
    "person": {
      "id": "<object-id>",
      "institutionId": "<object-id>",
      "nombre": "Instructor Demo",
      "documento": "DOC-DEMO-001",
      "roles": ["INSTRUCTOR"]
    }
  }
}
```

## Catálogo

| Método | Ruta                                      | Auth | Descripción                                |
| ------ | ----------------------------------------- | ---- | ------------------------------------------ |
| GET    | `/api/institutions`                       | Sí   | Lista de instituciones activas.            |
| GET    | `/api/units?institutionId=...`            | Sí   | Lista de unidades académicas activas.      |
| GET    | `/api/units/:unitId/enrollments`          | Sí   | Inscritos vigentes en la unidad.           |

## Sesiones (rol ADMIN, DOCENTE o INSTRUCTOR)

| Método | Ruta                                          | Descripción                                   |
| ------ | --------------------------------------------- | --------------------------------------------- |
| POST   | `/api/sessions`                               | Crea sesión `DRAFT`.                          |
| POST   | `/api/sessions/:id/activate`                  | Activa, genera `qrToken` y `roomCode`.        |
| POST   | `/api/sessions/:id/room-code/rotate`          | Rota el código de sala.                       |
| POST   | `/api/sessions/:id/close`                     | Cierra la sesión.                             |
| GET    | `/api/sessions/:id/present`                   | Lista de presentes.                           |
| GET    | `/api/sessions/:id/absent`                    | Lista de ausentes (inscritos no presentes).   |
| GET    | `/api/sessions/:id/rejections`                | Intentos rechazados con motivo.               |
| GET    | `/api/sessions/by-unit/:unitId`               | Historial de sesiones de la unidad.           |

### POST `/api/sessions/:id/activate` (ejemplo de respuesta)

```json
{
  "data": {
    "id": "<object-id>",
    "status": "ACTIVE",
    "qrToken": "<uuid>",
    "qrExpiresAt": "2026-05-06T12:30:00.000Z",
    "roomCode": "QRD01",
    "roomCodeExpiresAt": "2026-05-06T12:21:30.000Z",
    "qrUrl": "http://localhost:5173/attendance/<uuid>",
    "qrPng": "data:image/png;base64,..."
  }
}
```

## Registro público (sin auth)

| Método | Ruta                                            | Descripción                                |
| ------ | ----------------------------------------------- | ------------------------------------------ |
| GET    | `/public/attendance/:token`                     | Estado público de la sesión.               |
| POST   | `/public/attendance/:token/register`            | Registra asistencia con `documento`.       |

### POST `/public/attendance/:token/register`

```json
{ "documento": "EST-DEMO-001" }
```

**Respuestas:**

- `201` — `{ "data": { "id", "documento", "nombre", "sessionId", "registeredAt" } }`
- `400 NOT_ENROLLED` — persona no inscrita.
- `400 NOT_FOUND` — documento inexistente en la institución.
- `400 DUPLICATE` — ya registrada.
- `410 GONE` — sesión cerrada o QR expirado.

## Errores estándar

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "La solicitud no cumple el contrato esperado.",
    "details": { },
    "trace_id": "<uuid>"
  }
}
```

| Código              | HTTP |
| ------------------- | ---- |
| `VALIDATION_ERROR`  | 400  |
| `UNAUTHORIZED`      | 401  |
| `FORBIDDEN`         | 403  |
| `NOT_FOUND`         | 404  |
| `CONFLICT`          | 409  |
| `GONE`              | 410  |
| `INTERNAL_ERROR`    | 500  |
