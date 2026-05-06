/* eslint-disable */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCORM_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.resolve(__dirname, '..', '..');
const OUT_FILE = path.join(OUT_DIR, 'app-attendance-scorm-moodle.zip');

const REQUIRED = ['imsmanifest.xml', 'index.html', 'css/styles.css', 'js/scorm.js', 'js/app.js'];

for (const rel of REQUIRED) {
  const full = path.join(SCORM_DIR, rel);
  if (!fs.existsSync(full)) {
    console.error(`[scorm:zip] falta archivo requerido: ${rel}`);
    process.exit(1);
  }
}

if (fs.existsSync(OUT_FILE)) fs.unlinkSync(OUT_FILE);

try {
  if (process.platform === 'win32') {
    const list = REQUIRED.map((r) => `'${r.replace(/'/g, "''")}'`).join(',');
    const ps = `Set-Location -LiteralPath '${SCORM_DIR}'; Compress-Archive -LiteralPath ${list} -DestinationPath '${OUT_FILE}' -Force`;
    execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { stdio: 'inherit' });
  } else {
    execSync(`cd "${SCORM_DIR}" && zip -r "${OUT_FILE}" ${REQUIRED.map((r) => `"${r}"`).join(' ')}`, { stdio: 'inherit' });
  }
  console.log(`[scorm:zip] generado: ${OUT_FILE}`);
} catch (err) {
  console.error('[scorm:zip] error:', err.message);
  process.exit(1);
}
