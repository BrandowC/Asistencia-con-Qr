# Arquitectura

## Visión por capas

```
PC docente / instructor                Celular del estudiante
        │                                       │
   Ionic React + Capacitor              /attendance/:token (página pública)
        │ Authorization: Bearer <JWT>           │
        ▼                                       ▼
┌────────────────────────────────────────────────────────┐
│                Backend Express + TypeScript            │
│  · Helmet, CORS, Morgan, Zod, JWT                      │
│  · Servicios: auth, sessions, attendance               │
│  · Tareas: expira sesiones cada 60s                    │
└────────────────────────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────────────────────────┐
│             MongoDB 7 vía Docker Compose               │
│  · Volumen persistente app_attendance_mongo_data       │
│  · Inicializado con db/init                            │
└────────────────────────────────────────────────────────┘
```

## Decisiones clave

- **El frontend nunca toca MongoDB.** Toda escritura/lectura pasa por la API REST.
- **JWT corto** (12h por defecto) firmado con `JWT_SECRET`. No se usa refresh token: la sesión es académica.
- **QR token** (UUID v4) y **código de sala** rotativo de 5 caracteres con TTL configurable: el QR identifica
  la sesión, el código de sala dificulta el fraude por reenvío del link.
- **Rechazos auditables** (`attendance_records` con `status: 'REJECTED'`) — no se silencian errores.
- **Datos sintéticos** (`*-DEMO-*`) para sustentación: no hay PII real en el repositorio.

## Componentes

| Carpeta  | Responsabilidad                                              |
| -------- | ------------------------------------------------------------ |
| `app/`   | Frontend Ionic React + Vite + Capacitor                      |
| `back/`  | API REST Express con TypeScript                              |
| `db/`    | Inicialización y datos del contenedor Mongo                  |
| `docs/`  | Documentación técnica                                        |
| `scorm/` | Paquete SCORM 1.2 para Moodle                                |

## Flujo de una sesión

1. `POST /api/sessions` crea la sesión en `DRAFT`.
2. `POST /api/sessions/:id/activate` genera `qrToken`, `qrExpiresAt`, `roomCode`, devuelve PNG QR.
3. Estudiante escanea → `GET /attendance/:token` (frontend) → `POST /public/attendance/:token/register`.
4. El backend valida: token activo, QR no expirado, persona inscrita, sin asistencia previa.
5. Resultado: `accepted` (con `personId`) o `rejected` (con `rejectReason`).
6. Docente ve `present`, `absent`, `rejections` en vivo (poll 5s).
7. `POST /api/sessions/:id/close` marca `CLOSED`.
8. Tarea programada cada 60s expira sesiones con `qrExpiresAt` vencido.
