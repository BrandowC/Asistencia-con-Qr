// Script de inicialización ejecutado por la imagen oficial mongo:7
// la primera vez que se levanta el contenedor.
// Crea la base de datos lógica `app_attendance` y un índice básico.

const dbName = 'app_attendance';
const targetDb = db.getSiblingDB(dbName);

targetDb.createCollection('institutions');
targetDb.institutions.createIndex({ code: 1 }, { unique: true });

print(`[init] base de datos ${dbName} preparada.`);
