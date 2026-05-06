# scorm/

Paquete SCORM 1.2 listo para importar en Moodle.

## Estructura

```
scorm/
├── imsmanifest.xml       Manifest SCORM 1.2 (raíz del ZIP)
├── index.html            Landing principal
├── css/
│   └── styles.css        Estilos
├── js/
│   ├── scorm.js          Wrapper SCORM 1.2 (LMS API + fallback localStorage)
│   └── app.js            Interactividad: progreso, copiar, autoevaluación
└── scripts/
    └── build-zip.cjs     Genera el ZIP desde la raíz del repo
```

## Generar el ZIP

Desde la raíz del repositorio:

```powershell
npm run scorm:zip
```

Esto crea `app-attendance-scorm-moodle.zip` en la raíz, listo para subir a Moodle.

## Probar offline

Abrir `scorm/index.html` directamente en un navegador. Sin LMS, el wrapper usa `localStorage`
para simular persistencia y la barra superior mostrará "Modo offline".

## Importar en Moodle

1. Entrar al curso → Activar edición.
2. Agregar actividad o recurso → Paquete SCORM.
3. Subir `app-attendance-scorm-moodle.zip`.
4. Guardar y mostrar.

## Aviso

Todos los textos, comandos y datos del paquete usan placeholders sintéticos.
No incluye nombres, documentos, contraseñas, tokens ni URLs reales.
