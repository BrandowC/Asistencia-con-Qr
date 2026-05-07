import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { InstitutionModel } from './models/institution.js';
import { PersonModel } from './models/person.js';
import { PermissionModel } from './models/permission.js';

/**
 * Bootstrap mínimo:
 * - Una institución de arranque para que el ADMIN pueda iniciar sesión.
 * - Un único usuario ADMIN.
 * - Permisos por rol.
 *
 * Todo lo demás (instituciones reales, unidades, personas) se crea desde
 * la app en la sección "Gestión".
 *
 * Las credenciales del ADMIN se leen de variables de entorno o usan valores
 * de bootstrap que el usuario debe cambiar tras el primer login.
 */
const BOOTSTRAP_INSTITUTION_CODE = process.env.BOOTSTRAP_INSTITUTION_CODE ?? 'INST-001';
const BOOTSTRAP_INSTITUTION_NAME = process.env.BOOTSTRAP_INSTITUTION_NAME ?? 'Institución inicial';
const BOOTSTRAP_INSTITUTION_CONTEXT = (process.env.BOOTSTRAP_INSTITUTION_CONTEXT ?? 'UNIVERSIDAD') as 'SENA' | 'UNIVERSIDAD';
const ADMIN_DOCUMENTO = process.env.ADMIN_DOCUMENTO ?? 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'cambiar-en-primer-login';
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE ?? 'Administrador';

async function seed() {
  await connectDb();

  console.log('[seed] asegurando institución de arranque...');
  let institution = await InstitutionModel.findOne({ code: BOOTSTRAP_INSTITUTION_CODE });
  if (!institution) {
    institution = await InstitutionModel.create({
      code: BOOTSTRAP_INSTITUTION_CODE,
      name: BOOTSTRAP_INSTITUTION_NAME,
      context: BOOTSTRAP_INSTITUTION_CONTEXT,
      labels:
        BOOTSTRAP_INSTITUTION_CONTEXT === 'SENA'
          ? { formador: 'Instructor', aprendiz: 'Aprendiz', unidad: 'Ficha' }
          : { formador: 'Docente', aprendiz: 'Estudiante', unidad: 'Materia' },
    });
    console.log(`[seed] institución creada: ${institution.code} - ${institution.name}`);
  } else {
    console.log(`[seed] institución ya existía: ${institution.code}`);
  }

  console.log('[seed] asegurando usuario ADMIN...');
  let admin = await PersonModel.findOne({
    institutionId: institution._id,
    documento: ADMIN_DOCUMENTO,
  });
  if (!admin) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, env.BCRYPT_ROUNDS);
    admin = await PersonModel.create({
      institutionId: institution._id,
      documento: ADMIN_DOCUMENTO,
      nombre: ADMIN_NOMBRE,
      passwordHash,
      roles: ['ADMIN'],
    });
    console.log(`[seed] admin creado: ${admin.documento} (institución ${institution.code})`);
    console.log(`[seed] contraseña inicial: ${ADMIN_PASSWORD}`);
    console.log('[seed] cambiala después del primer login.');
  } else {
    console.log('[seed] admin ya existía.');
  }

  console.log('[seed] sembrando permisos por rol...');
  const desiredPerms: { role: string; resource: string; action: string }[] = [];
  for (const role of ['ADMIN', 'DOCENTE', 'INSTRUCTOR']) {
    for (const resource of ['institutions', 'units', 'people', 'enrollments', 'sessions', 'records']) {
      for (const action of ['read', 'write']) {
        desiredPerms.push({ role, resource, action });
      }
    }
  }
  for (const p of desiredPerms) {
    await PermissionModel.updateOne(p, { $set: p }, { upsert: true });
  }

  console.log('[seed] listo.');
  console.log('[seed] entra con:');
  console.log(`  · institución: ${institution.code}`);
  console.log(`  · documento:   ${ADMIN_DOCUMENTO}`);
  console.log(`  · password:    ${ADMIN_PASSWORD}`);
  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('[seed:error]', err);
  await disconnectDb();
  process.exit(1);
});
