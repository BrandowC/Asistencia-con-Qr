# Seguridad y privacidad

Este repositorio se publica con criterios de **dato sintético**. Antes de cualquier entrega revisar este documento.

## Datos que NO deben publicarse

- Nombres reales de personas.
- Documentos de identidad reales (cédulas, tarjetas, pasaportes).
- Teléfonos o correos personales.
- Contraseñas reales.
- `JWT_SECRET` real, llaves privadas, archivos `.env` con valores reales.
- Tokens emitidos en producción o en demos públicas.
- URLs activas de túneles (ngrok, Cloudflare Tunnel, etc.).
- Capturas con información identificable.
- Seeds privados o exportes de la base de datos en producción.

## Datos que SÍ pueden publicarse

- Datos demo con prefijo `*-DEMO-*` o `<placeholder>`.
- Diagramas conceptuales sin referencias internas.
- Comandos genéricos.
- Variables con placeholders del tipo `<...>`.
- Capturas anonimizadas o reemplazadas por mockups.
- Flujos funcionales y reglas de negocio.
- Checklists de validación.

## Controles aplicados en código

- `JWT_SECRET` se valida con Zod (mínimo 16 caracteres) y nunca tiene default seguro.
- `passwordHash` se selecciona explícitamente con `+passwordHash`; el campo no se devuelve en respuestas.
- `helmet` agrega cabeceras estándar.
- `cors` se restringe vía `API_CORS_ORIGIN` (lista separada por comas).
- Errores devuelven `trace_id` (UUID) y nunca el `stack`.
- Rechazos de asistencia se persisten con motivo trazable, sin filtrar PII de otras instituciones.

## Checklist antes de subir a Moodle

- [ ] Sin nombres ni documentos reales de estudiantes.
- [ ] Sin tokens, passwords, `JWT_SECRET` real ni variables privadas.
- [ ] URLs reales de túneles reemplazadas por `https://example.com` o placeholders.
- [ ] Capturas anonimizadas o reemplazadas por mockups.
- [ ] Comandos no destructivos.
- [ ] `.env` real **fuera** del ZIP y del repositorio (`.gitignore` ya lo excluye).
