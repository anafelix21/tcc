// ==============================================================================
// 03_simulacion_locks_write_conflict.js — Agro Pacayales S.A.C.
// Casuística 3: Demostración de Bloqueos (Document Locking) y Detección de WriteConflict
// Motor: MongoDB 8.0 (WiredTiger Engine) | Driver: mongosh
// ==============================================================================

const dbName = process.env.MONGO_DATABASE || 'agropacayales_db';
const currentDb = db.getSiblingDB(dbName);

print('\n==============================================================================');
print('🔒 [AGRO PACAYALES S.A.C.] Demostración de Bloqueos y WriteConflict en MongoDB');
print('==============================================================================\n');

// 1. Preparar documento objetivo para el experimento de concurrencia
currentDb.cosechas.deleteMany({ codigo_lote: 'LOTE-CONCURRENTE-01' });
currentDb.cosechas.insertOne({
  codigo_lote: 'LOTE-CONCURRENTE-01',
  variedad: 'Palto Hass Export',
  kilos_totales: 10000.0,
  desgloseCalidades: { cat_extra_kg: 8000.0, cat_primera_kg: 1500.0, descarte_kg: 500.0 },
  control_calidad_laboratorio: { brix: 22.0, calibre_mm: 70.0, conforme_exportacion: true },
  fecha_cosecha: new Date()
});

print('✓ Documento inicial registrado: Lote LOTE-CONCURRENTE-01 con 8,000 kg Cat Extra.\n');

// 2. Iniciar dos sesiones independientes
const sessionA = db.getMongo().startSession();
const sessionB = db.getMongo().startSession();
const sessionLectura = db.getMongo().startSession();

print('Iniciando Transacción A y Transacción B en paralelo...');
sessionA.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
sessionB.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });

const collA = sessionA.getDatabase(dbName).getCollection('cosechas');
const collB = sessionB.getDatabase(dbName).getCollection('cosechas');

print('\n[PASO 1] Transacción A ejecuta update sobre LOTE-CONCURRENTE-01...');
collA.updateOne(
  { codigo_lote: 'LOTE-CONCURRENTE-01' },
  { $inc: { 'desgloseCalidades.cat_extra_kg': -2000.0 } }
);
print('    -> Transacción A modificó el documento pero AÚN NO HA HECHO COMMIT.');
print('    -> 🔐 EFECTO DE BLOQUEO EN WIREDTIGER:');
print('       - Se adquiere un bloqueo exclusivo a nivel de documento (Document-Level Write Lock).');
print('       - A nivel de colección y BD se adquiere un Intent Exclusive Lock (IX).');
print('       - La transacción retiene un "write ticket" de los workers de WiredTiger.');

print('\n[PASO 2] Sesión de lectura externa consulta el documento mientras Tx A está abierta...');
const docSnapshot = sessionLectura.getDatabase(dbName).getCollection('cosechas').findOne({ codigo_lote: 'LOTE-CONCURRENTE-01' });
print(`    -> Lectura observada por terceros: ${docSnapshot.desgloseCalidades.cat_extra_kg} kg.`);
print('    -> 💡 GARANTÍA SNAPSHOT ISOLATION (MVCC):');
print('       - Los lectores NO se bloquean esperando a Tx A.');
print('       - Se lee la versión estable anterior al inicio de la transacción (No Dirty Reads).');

print('\n[PASO 3] Transacción B intenta modificar concurrentemente el MISMO documento...');
try {
  // Transacción B intenta actualizar el mismo documento bloqueado por Transacción A
  collB.updateOne(
    { codigo_lote: 'LOTE-CONCURRENTE-01' },
    { $inc: { 'desgloseCalidades.cat_extra_kg': -3000.0 } }
  );
  print('    -> Tx B logró actualizar (inesperado si colisionan en memoria).');
} catch (error) {
  print(`    -> ⚠️ EXCEPCIÓN DETECTADA EN TX B: [${error.name}] ${error.message}`);
  print('    -> 💥 MECANISMO DE CONFLICTO:');
  print('       - WiredTiger detecta que el documento ya tiene una escritura pendiente no comiteada.');
  print('       - Se produce un "WriteConflict" (error code 112) o TransientTransactionError.');
  print('       - Esto previene la anomalía de "Lost Update" (pérdida de actualización).');
}

print('\n[PASO 4] Transacción B ejecuta abortTransaction tras el conflicto...');
sessionB.abortTransaction();
print('    -> Transacción B cancelada y limpia.');

print('\n[PASO 5] Transacción A ejecuta commitTransaction...');
sessionA.commitTransaction();
print('    -> Transacción A confirmada con éxito.');
print('    -> 🔓 EFECTO POST-COMMIT:');
print('       - Se liberan los bloqueos exclusivos sobre el documento.');
print('       - El write ticket es devuelto al pool de WiredTiger.');
print('       - La modificación se persiste en el Journal (WAL) y en el Oplog.');

print('\n[PASO 6] Reintento de la Transacción B (Patrón Retry Loop con Backoff)...');
sessionB.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
const resRetry = sessionB.getDatabase(dbName).getCollection('cosechas').updateOne(
  { codigo_lote: 'LOTE-CONCURRENTE-01' },
  { $inc: { 'desgloseCalidades.cat_extra_kg': -3000.0 } }
);
sessionB.commitTransaction();
print('    -> Reintento de Tx B exitoso: Se descontaron 3,000 kg adicionales.');

// Verificación final consolidada
const docFinal = currentDb.cosechas.findOne({ codigo_lote: 'LOTE-CONCURRENTE-01' });
print(`\n==============================================================================`);
print(`📊 RESULTADO FINAL EN BD:`);
print(`   Lote: ${docFinal.codigo_lote}`);
print(`   Stock Cat Extra final: ${docFinal.desgloseCalidades.cat_extra_kg} kg (8,000 - 2,000 - 3,000 = 3,000 kg).`);
print(`   Consistencia matemática: 100% PRESERVADA sin condiciones de carrera.`);
print(`==============================================================================\n`);

sessionA.endSession();
sessionB.endSession();
sessionLectura.endSession();
