# db/

Configuración de MongoDB para entorno local.

## Estructura

```
db/
└── init/
    └── 01-create-app-db.js   Script ejecutado por mongo:7 al iniciar el volumen.
```

El seed real se ejecuta desde el backend (`back/src/seed.ts`) y se invoca con:

```powershell
npm run docker:seed
```

> Todos los datos generados son sintéticos (placeholders `*-DEMO-*`). No se utilizan documentos, nombres ni correos reales.
