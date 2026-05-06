# Modelo de datos

Base de datos: `app_attendance` (MongoDB 7).

| Colección             | Campos clave                                                        | Reglas / índices                                       |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| `institutions`        | `code`, `name`, `context`, `labels`, `theme`, `active`              | `code` único.                                          |
| `academic_units`      | `institutionId`, `code`, `name`, `type` (`FICHA`/`MATERIA`)         | `institutionId+code` único.                            |
| `people`              | `institutionId`, `documento`, `nombre`, `roles`, `passwordHash`     | `institutionId+documento` único.                       |
| `enrollments`         | `institutionId`, `unitId`, `personId`, `active`                     | `unitId+personId` único.                               |
| `attendance_sessions` | `status`, `qrToken`, `qrExpiresAt`, `roomCode`, `roomCodeExpiresAt` | `qrToken` único parcial (sólo strings).                |
| `attendance_records`  | `sessionId`, `personId`, `documento`, `status`, `rejectReason`      | Único parcial: `accepted` por `sessionId+personId`.    |
| `permissions`         | `role`, `resource`, `action`                                        | `role+resource+action` único.                          |

## Estados

- **`attendance_sessions.status`**: `DRAFT → ACTIVE → CLOSED | EXPIRED`.
- **`attendance_records.status`**: `ACCEPTED` | `REJECTED`.
- **`attendance_records.rejectReason`**: `NOT_FOUND`, `NOT_ENROLLED`, `DUPLICATE`, `SESSION_CLOSED`, `QR_EXPIRED`, `INVALID_ROOM_CODE`.

## Roles

`ADMIN`, `DOCENTE`, `INSTRUCTOR`, `ESTUDIANTE`, `APRENDIZ`.

Los roles administrativos (`ADMIN`, `DOCENTE`, `INSTRUCTOR`) pueden iniciar sesión vía `/api/auth/login`.
Estudiantes y aprendices se registran sólo por la ruta pública `/public/attendance/:token`.
