# Validación técnica

Comandos para validar el repositorio antes de la sustentación.

## Estructura del repo

```powershell
git status
git branch --show-current
git log --oneline --decorate --graph -n 10
```

## Verificación de tipos y lint

```powershell
npm run typecheck
npm run lint
```

> Si algún script no existe en una sub-carpeta (`back/` o `app/`), el script de la raíz lo ignora (`--if-present`).

## Build

```powershell
npm run build:back
npm run build:app
```

## Docker

```powershell
docker compose config
docker compose up -d --build
docker compose ps
docker compose logs -f api mongo
```

## Endpoints

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/ready
$body = @{ documento = 'DOC-DEMO-001'; password = 'Demo.2025'; institutionCode = 'SENA-DEMO' } | ConvertTo-Json
Invoke-RestMethod http://localhost:4000/api/auth/login -Method Post -ContentType 'application/json' -Body $body
```

## SCORM

```powershell
npm run scorm:zip
```

El comando crea `app-attendance-scorm-moodle.zip` en la raíz. Verifica que contenga:

```
imsmanifest.xml
index.html
css/styles.css
js/scorm.js
js/app.js
```

Para inspección manual:

```powershell
Expand-Archive .\app-attendance-scorm-moodle.zip .\_scorm-tmp -Force
Get-ChildItem .\_scorm-tmp -Recurse
```
