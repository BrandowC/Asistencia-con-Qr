# Asistencia con QR

Sistema académico para tomar asistencia mediante sesiones temporales con código QR y código de sala anti-fraude. Desarrollado como Taller 1 del 3er corte de Programación Móvil.

> Aviso de privacidad: este repositorio NO contiene datos personales reales. Todos los ejemplos, semillas y capturas usan datos sintéticos.

## Stack

| Capa            | Tecnología                                          |
| --------------- | --------------------------------------------------- |
| App móvil/web   | Ionic React + Vite + Capacitor                      |
| Backend         | Node.js + Express + TypeScript + Mongoose + Zod     |
| Base de datos   | MongoDB 7 (Docker)                                  |
| Autenticación   | JWT Bearer                                          |
| Entrega Moodle  | Paquete SCORM 1.2                                   |

## Estructura del repositorio

```
.
├── app/        Ionic React + Capacitor (frontend móvil/web)
├── back/       API Express + TypeScript
├── db/         Configuración Mongo y seeds sintéticos
├── docs/       Arquitectura, API, modelo, operación y validación
├── scorm/      Paquete SCORM 1.2 para Moodle
├── docker-compose.yml
├── .env.example
└── package.json
```

## Inicio rápido

```powershell
# 1. Copiar variables de entorno
Copy-Item .env.example .env

# 2. Instalar dependencias (raíz, backend y app)
npm run install:all

# 3. Levantar servicios (Mongo + API + App)
npm run docker:up

# 4. Cargar datos demo
npm run docker:seed

# 5. Verificar salud del backend
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready

# 6. App en modo desarrollo
npm run dev:app
```

URLs locales esperadas:

| Servicio | URL                       |
| -------- | ------------------------- |
| App Vite | http://localhost:5173     |
| App Docker (nginx) | http://localhost:8080 |
| API      | http://localhost:4000     |
| Mongo    | mongodb://localhost:27017 |

## Funcionalidades

- Login del docente/instructor con JWT.
- Selección de institución y unidad académica (ficha o materia).
- Listado de inscritos por unidad.
- Sesión de asistencia temporal con QR + código de sala rotativo.
- Registro público vía `/attendance/:token` para el estudiante.
- Resultados: presentes, ausentes y rechazos auditables.
- Historial de sesiones por unidad.

## Privacidad

Antes de subir a Moodle revisar el [checklist de privacidad](docs/security.md). En esta entrega:

- No publicar nombres, documentos, contraseñas, tokens o URLs reales.
- Usar siempre placeholders `<...>` en `.env` y documentación.
- Capturas anonimizadas o reemplazadas por mockups.

## Documentación

- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/model.md)
- [Contrato API](docs/api.md)
- [Operación local](docs/operation.md)
- [Validación técnica](docs/validation.md)
- [Seguridad y privacidad](docs/security.md)
- [Guía de sustentación](docs/sustentation.md)

## Licencia

Proyecto académico — uso educativo.
