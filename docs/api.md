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
  "documento": "<documento del usuario>",
  "password": "<password>",
  "institutionCode": "<opcional>"
}
```

**200**:
```json
{
  "data": {
    "token": "<jwt>",
    "person": {
      "id": "<object-id>",
      "institutionId": "<object-id>",
      "nombre": "<Nombre>",
      "documento": "<documento>",
      "roles": ["INSTRUCTOR"]
    }
  }
}
```

## Catálogo y gestión

| Método | Ruta                                      | Auth        | Descripción                                |
| ------ | ----------------------------------------- | ----------- | ------------------------------------------ |
| GET    | `/api/institutions`                       | Sí          | Lista de instituciones activas.            |
| POST   | `/api/institutions`                       | ADMIN       | Crea institución.                          |
| PATCH  | `/api/institutions/:id`                   | ADMIN       | Actualiza institución.                     |
| DELETE | `/api/institutions/:id`                   | ADMIN       | Desactiva institución (borrado lógico).    |
| GET    | `/api/units?institutionId=...`            | Sí          | Lista unidades académicas activas.         |
| POST   | `/api/units`                              | Staff       | Crea unidad académica.                     |
| PATCH  | `/api/units/:id`                          | Staff       | Actualiza unidad académica.                |
| DELETE | `/api/units/:id`                          | Staff       | Desactiva unidad académica.                |
| GET    | `/api/units/:unitId/enrollments`          | Sí          | Inscritos vigentes en la unidad.           |
| GET    | `/api/people?institutionId=&role=&q=`     | Staff       | Lista personas (búsqueda parcial).         |
| POST   | `/api/people`                             | Staff       | Crea persona (con roles e inscripciones).  |
| PATCH  | `/api/people/:id`                         | Staff       | Actualiza persona.                         |
| DELETE | `/api/people/:id`                         | Staff       | Desactiva persona y sus inscripciones.     |
| DELETE | `/api/people/:id/hard`                    | Staff       | Borrado físico (solo si no tiene records). |
| POST   | `/api/enrollments`                        | Staff       | Inscribe persona en unidad.                |
| DELETE | `/api/enrollments/:id`                    | Staff       | Retira inscripción (lógico).               |

> *Staff*: ADMIN, DOCENTE o INSTRUCTOR.

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
