// ==============================================================================
// 01_despacho_cosecha_transaccion.js — Agro Pacayales S.A.C.
// Casuística 1: Despacho de Exportación de Palto Hass con Descuento Atómico de Stock
// Motor: MongoDB 8.0 | Driver: mongosh
// ==============================================================================

const dbName = process.env.MONGO_DATABASE || 'agropacayales_db';
const currentDb = db.getSiblingDB(dbName);

print('\n======================================================================');
print('🚜 [AGRO PACAYALES S.A.C.] Transacción ACID: Despacho de Exportación');
print('======================================================================\n');

// 1. Preparación de datos semilla para la prueba
currentDb.cosechas.deleteMany({ codigo_lote: 'LOTE-PALTO-HASS-EXP-01' });
currentDb.ordenes_despacho.deleteMany({ codigo_orden: { $in: ['ORD-EXP-2026-001', 'ORD-EXP-2026-002'] } });

currentDb.cosechas.insertOne({
  codigo_lote: 'LOTE-PALTO-HASS-EXP-01',
  variedad: 'Palto Hass',
  kilos_totales: 25000.0,
  desgloseCalidades: {
    cat_extra_kg: 18000.0,
    cat_primera_kg: 5000.0,
    descarte_kg: 2000.0
  },
  control_calidad_laboratorio: {
    brix: 21.5,
    calibre_mm: 72.0,
    conforme_exportacion: true
  },
  fecha_cosecha: new Date()
});

print('✓ Semilla insertada: Lote LOTE-PALTO-HASS-EXP-01 con 18,000 kg de Calidad Extra.');

// Función transaccional reutilizable
function procesarDespachoExportacion(codigoOrden, kilosRequeridos, clienteExportacion) {
  print(`\n--- Intentando procesar orden ${codigoOrden} por ${kilosRequeridos} kg ---`);

  // Paso A: Iniciar una Sesión de Cliente (ClientSession)
  const session = db.getMongo().startSession();

  // Paso B: Iniciar la transacción con niveles de garantía ACID
  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority', j: true },
    readPreference: 'primary'
  });

  const sessionDb = session.getDatabase(dbName);
  const cosechasColl = sessionDb.getCollection('cosechas');
  const ordenesColl = sessionDb.getCollection('ordenes_despacho');
  const auditoriaColl = sessionDb.getCollection('auditoria_labores');

  try {
    // 1. Lectura snapshot del lote
    const lote = cosechasColl.findOne({ codigo_lote: 'LOTE-PALTO-HASS-EXP-01' });

    if (!lote) {
      throw new Error('El lote de cosecha especificado no existe.');
    }

    const stockDisponible = lote.desgloseCalidades.cat_extra_kg;
    print(`    [Lectura Snapshot] Stock actual Cat Extra: ${stockDisponible} kg.`);

    // 2. Validación de regla de negocio (Invariante de consistencia)
    if (stockDisponible < kilosRequeridos) {
      throw new Error(`Stock insuficiente. Disponible: ${stockDisponible} kg, Solicitado: ${kilosRequeridos} kg.`);
    }

    // 3. Modificación 1: Descuento atómico del inventario exportable
    const updateResult = cosechasColl.updateOne(
      { codigo_lote: 'LOTE-PALTO-HASS-EXP-01' },
      {
        $inc: {
          'desgloseCalidades.cat_extra_kg': -kilosRequeridos,
          'kilos_totales': -kilosRequeridos
        }
      }
    );

    if (updateResult.modifiedCount !== 1) {
      throw new Error('No se pudo actualizar el stock del lote.');
    }
    print(`    [Update] Se descontaron ${kilosRequeridos} kg del inventario.`);

    // 4. Modificación 2: Registro de la orden de exportación comercial
    ordenesColl.insertOne({
      codigo_orden: codigoOrden,
      codigo_lote: 'LOTE-PALTO-HASS-EXP-01',
      cliente: clienteExportacion,
      kilos_despachados: kilosRequeridos,
      contenedor_refrigerado: 'CONT-REEFER-40HC-9921',
      temperatura_setpoint_celsius: 5.5,
      fecha_despacho: new Date(),
      estado: 'CONFIRMADO'
    });
    print(`    [Insert] Orden de despacho ${codigoOrden} registrada exitosamente.`);

    // 5. Modificación 3: Registro de auditoría inmutable
    auditoriaColl.insertOne({
      entidad: 'cosechas',
      accion: 'DESPACHO_EXPORTACION',
      usuario: 'axel.huapaya@agropacayales.pe',
      detalles: `Despacho de ${kilosRequeridos} kg hacia ${clienteExportacion}. Orden: ${codigoOrden}`,
      timestamp: new Date()
    });
    print('    [Auditoría] Evento registrado en auditoria_labores.');

    // Paso C: Confirmar la transacción (Commit Atómico)
    session.commitTransaction();
    print(`\n  ✅ COMMIT EXITOSO: La orden ${codigoOrden} se consolidó con éxito.`);

  } catch (error) {
    // Paso D: Abortar la transacción ante cualquier fallo (Rollback Atómico)
    session.abortTransaction();
    print(`\n  ❌ ABORT TRANSACTION: ${error.message}`);
    print('     Todos los cambios fueron revertidos automáticamente.');
  } finally {
    // Finalizar y liberar la sesión
    session.endSession();
  }
}

// Escenario 1: Despacho exitoso (Camino Feliz - Commit)
procesarDespachoExportacion('ORD-EXP-2026-001', 10000.0, 'Rotterdam Fresh Fruits B.V. (Países Bajos)');

// Verificación post-transacción 1
const postLote1 = currentDb.cosechas.findOne({ codigo_lote: 'LOTE-PALTO-HASS-EXP-01' });
print(`    -> Saldo restante verificado en base de datos: ${postLote1.desgloseCalidades.cat_extra_kg} kg.`);

// Escenario 2: Intento de sobregiro de stock (Camino de Falla - Abort/Rollback)
procesarDespachoExportacion('ORD-EXP-2026-002', 15000.0, 'Hamburg Port Import GmbH (Alemania)');

// Verificación post-transacción 2: Demostrar que el stock NO fue alterado
const postLote2 = currentDb.cosechas.findOne({ codigo_lote: 'LOTE-PALTO-HASS-EXP-01' });
print(`    -> Saldo final inalterado (Consistencia preservada): ${postLote2.desgloseCalidades.cat_extra_kg} kg.`);
const ordenFallida = currentDb.ordenes_despacho.findOne({ codigo_orden: 'ORD-EXP-2026-002' });
print(`    -> ¿Existe orden fallida en BD?: ${ordenFallida ? 'SÍ (ERROR)' : 'NO (Atomicidad cumplida)'}`);
