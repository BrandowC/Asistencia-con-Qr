import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDb, disconnectDb } from './lib/db.js';
import { InstitutionModel } from './models/institution.js';
import { AcademicUnitModel } from './models/academic-unit.js';
import { PersonModel } from './models/person.js';
import { EnrollmentModel } from './models/enrollment.js';
import { PermissionModel } from './models/permission.js';

const DEMO_PASSWORD = 'Demo.2025';

async function seed() {
  await connectDb();
  console.log('[seed] limpiando colecciones...');
  await Promise.all([
    InstitutionModel.deleteMany({}),
    AcademicUnitModel.deleteMany({}),
    PersonModel.deleteMany({}),
    EnrollmentModel.deleteMany({}),
    PermissionModel.deleteMany({}),
  ]);

  console.log('[seed] creando instituciones...');
  const sena = await InstitutionModel.create({
    code: 'SENA-DEMO',
    name: 'SENA Centro Demo',
    context: 'SENA',
    labels: { formador: 'Instructor', aprendiz: 'Aprendiz', unidad: 'Ficha' },
    theme: { primary: '#16a34a', secondary: '#22c55e' },
  });
  const uni = await InstitutionModel.create({
    code: 'UNI-DEMO',
    name: 'Universidad Demo',
    context: 'UNIVERSIDAD',
    labels: { formador: 'Docente', aprendiz: 'Estudiante', unidad: 'Materia' },
    theme: { primary: '#2563eb', secondary: '#0ea5e9' },
  });

  console.log('[seed] creando unidades académicas...');
  const ficha = await AcademicUnitModel.create({
    institutionId: sena._id,
    code: 'ADSO-DEMO-01',
    name: 'Análisis y Desarrollo de Software (Demo)',
    type: 'FICHA',
    description: 'Ficha sintética para demostración de asistencia.',
  });
  const materia = await AcademicUnitModel.create({
    institutionId: uni._id,
    code: 'BD-II-DEMO',
    name: 'Bases de Datos II (Demo)',
    type: 'MATERIA',
    description: 'Materia sintética para demostración.',
  });

  console.log('[seed] creando personas (formadores + estudiantes)...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.BCRYPT_ROUNDS);

  const instructor = await PersonModel.create({
    institutionId: sena._id,
    documento: 'DOC-DEMO-001',
    nombre: 'Instructor Demo',
    email: 'instructor-demo@example.com',
    passwordHash,
    roles: ['INSTRUCTOR'],
  });

  const docente = await PersonModel.create({
    institutionId: uni._id,
    documento: 'DOC-DEMO-002',
    nombre: 'Docente Demo',
    email: 'docente-demo@example.com',
    passwordHash,
    roles: ['DOCENTE'],
  });

  const aprendices = await PersonModel.insertMany(
    Array.from({ length: 8 }, (_, i) => ({
      institutionId: sena._id,
      documento: `APR-DEMO-${String(i + 1).padStart(3, '0')}`,
      nombre: `Aprendiz Demo ${i + 1}`,
      matricula: `M-DEMO-${String(i + 1).padStart(4, '0')}`,
      roles: ['APRENDIZ'],
    })),
  );

  const estudiantes = await PersonModel.insertMany(
    Array.from({ length: 6 }, (_, i) => ({
      institutionId: uni._id,
      documento: `EST-DEMO-${String(i + 1).padStart(3, '0')}`,
      nombre: `Estudiante Demo ${i + 1}`,
      matricula: `U-DEMO-${String(i + 1).padStart(4, '0')}`,
      roles: ['ESTUDIANTE'],
    })),
  );

  console.log('[seed] creando inscripciones...');
  await EnrollmentModel.insertMany(
    aprendices.map((p) => ({ institutionId: sena._id, unitId: ficha._id, personId: p._id })),
  );
  await EnrollmentModel.insertMany(
    estudiantes.map((p) => ({ institutionId: uni._id, unitId: materia._id, personId: p._id })),
  );

  console.log('[seed] sembrando permisos...');
  const perms: { role: string; resource: string; action: string }[] = [];
  for (const role of ['ADMIN', 'DOCENTE', 'INSTRUCTOR']) {
    for (const resource of ['institutions', 'units', 'sessions', 'records']) {
      for (const action of ['read', 'write']) {
        perms.push({ role, resource, action });
      }
    }
  }
  await PermissionModel.insertMany(perms);

  console.log('[seed] usuarios demo:');
  console.log(`  - ${instructor.documento} / ${DEMO_PASSWORD}  (institución ${sena.code})`);
  console.log(`  - ${docente.documento} / ${DEMO_PASSWORD}  (institución ${uni.code})`);
  console.log('[seed] listo.');
  await disconnectDb();
}

seed().catch(async (err) => {
  console.error('[seed:error]', err);
  await disconnectDb();
  process.exit(1);
});
