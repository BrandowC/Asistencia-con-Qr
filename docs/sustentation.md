# Guía de sustentación

## Orden recomendado

1. **Problema** — Asistencia manual: tiempo y errores.
2. **Arquitectura** — Frontend ↔ Backend ↔ Mongo, capas separadas.
3. **Modelo de datos** — `institutions`, `units`, `people`, `enrollments`, `sessions`, `records`.
4. **Flujo docente / instructor** — Login → selección → inscritos → activar QR.
5. **Generación QR + código de sala** — TTL configurable, rotación anti-fraude.
6. **Registro del estudiante** — `/attendance/:token`, validaciones.
7. **Resultados e historial** — Presentes, ausentes, rechazos auditables.
8. **Seguridad y privacidad** — Datos sintéticos, JWT, helmet, CORS.
9. **Validación técnica** — `health`, `ready`, scripts.
10. **Roadmap** — pruebas, despliegue, seguridad incremental.

## Preguntas esperadas

- **¿Por qué MongoDB y no almacenamiento local?** Persistencia compartida entre procesos, índices únicos, escalabilidad.
- **¿Por qué el frontend no se conecta a la base de datos?** Para no exponer credenciales, centralizar reglas de negocio y validación, aplicar autorización.
- **¿Cómo se evita duplicidad?** Índice único parcial sobre `attendance_records` con `status: 'ACCEPTED'` por `sessionId+personId`. Adicionalmente, validación previa.
- **¿Qué pasa si el QR expira?** Tarea de fondo cada 60s lo marca `EXPIRED`. Cualquier intento posterior se persiste como rechazo `QR_EXPIRED`.
- **¿Cómo se protege el JWT?** Firma HMAC con `JWT_SECRET` mínimo 16 caracteres, expiración corta (12h por defecto), validación obligatoria en rutas privadas, no se imprime en logs.
- **¿Cómo se desplegaría en AWS?** Imagen del backend en ECR → ECS Fargate; Mongo gestionado en Atlas o DocumentDB; frontend estático en CloudFront + S3; secretos en Secrets Manager.

## Checklist de demostración

- [ ] Levantar Docker (`npm run docker:up`) y validar `/health` y `/ready`.
- [ ] Sembrar datos demo (`npm run docker:seed`).
- [ ] Abrir la app (`npm run dev:app`) y configurar URL del backend si hace falta.
- [ ] Login con `DOC-DEMO-001` / `Demo.2025` (`SENA-DEMO`).
- [ ] Seleccionar institución y unidad demo.
- [ ] Generar sesión QR, registrar al menos un estudiante (`APR-DEMO-001`).
- [ ] Mostrar presentes, ausentes y un rechazo (intentar registrar `APR-DEMO-001` dos veces → `DUPLICATE`).
- [ ] Cerrar sesión y mostrar historial.
- [ ] Mostrar el paquete SCORM en Moodle (o abrir `scorm/index.html` en navegador).
