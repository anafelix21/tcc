// ==============================================================================
// 02_asignacion_insumos_transaccion.js — Agro Pacayales S.A.C.
// Casuística 2: Asignación y Consumo Fitosanitario en Ficha de Campo
// Motor: MongoDB 8.0 | Driver: mongosh
// ==============================================================================

const dbName = process.env.MONGO_DATABASE || 'agropacayales_db';
const currentDb = db.getSiblingDB(dbName);

print('\n======================================================================');
print('🧪 [AGRO PACAYALES S.A.C.] Transacción ACID: Consumo Fitosanitario');
print('======================================================================\n');

// 1. Semilla de datos para insumos y fichas de campo
currentDb.insumos.deleteMany({ sku: 'SKU-BIO-FUNGICIDA-01' });
currentDb.fichas_campo.deleteMany({ codigo_ficha: 'FICHA-CAMPO-2026-N10' });

currentDb.insumos.insertOne({
  sku: 'SKU-BIO-FUNGICIDA-01',
  nombre: 'Bio-Fungicida Bacillus Subtilis',
  tipo: 'Biológico',
  stock_disponible: 200.0,
  unidad_medida: 'Litros',
  tabla_dosificacion_cultivo: [
    { cultivo: 'Palto Hass', dosis_por_ha: 2.5 },
    { cultivo: 'Arándano Biloxi', dosis_por_ha: 1.8 }
  ]
});

currentDb.fichas_campo.insertOne({
  codigo_ficha: 'FICHA-CAMPO-2026-N10',
  id_parcela: 'PARC-NORTE-A1',
  evaluador: 'Ing. Ana Félix',
  protocolo_certificacion: {
    norma: 'GlobalGAP IFA v6',
    cumplimiento_pct: 98.5
  },
  monitoreo_plagas_evaluadas: [
    { plaga: 'Oidium (Oidium perseae)', severidad_pct: 12.0 }
  ],
  labores_aplicadas: []
});

print('✓ Semilla insertada: Insumo con 200 L disponibles y Ficha de Campo PARC-NORTE-A1.');

function aplicarTratamientoFitosanitario(codigoFicha, skuInsumo, litrosConsumo, operador) {
  print(`\n--- Aplicando tratamiento: ${litrosConsumo} L de ${skuInsumo} a ${codigoFicha} ---`);

  const session = db.getMongo().startSession();

  session.startTransaction({
    readConcern: { level: 'snapshot' },
    writeConcern: { w: 'majority', j: true }
  });

  const sessionDb = session.getDatabase(dbName);
  const insumosColl = sessionDb.getCollection('insumos');
  const fichasColl = sessionDb.getCollection('fichas_campo');
  const auditColl = sessionDb.getCollection('auditoria_labores');

  try {
    // Paso 1: Consultar stock disponible bajo Snapshot Isolation
    const insumoDoc = insumosColl.findOne({ sku: skuInsumo });
    if (!insumoDoc) {
      throw new Error(`Insumo con SKU ${skuInsumo} no encontrado.`);
    }

    print(`    [Snapshot] Stock actual disponible: ${insumoDoc.stock_disponible} ${insumoDoc.unidad_medida}.`);

    if (insumoDoc.stock_disponible < litrosConsumo) {
      throw new Error(`Stock insuficiente de ${insumoDoc.nombre}. Requerido: ${litrosConsumo}, Disponible: ${insumoDoc.stock_disponible}`);
    }

    // Paso 2: Decremento atómico del insumo
    const resInsumo = insumosColl.updateOne(
      { sku: skuInsumo },
      { $inc: { stock_disponible: -litrosConsumo } }
    );
    if (resInsumo.modifiedCount !== 1) {
      throw new Error('Fallo al decrementar stock en insumos.');
    }
    print(`    [Update insumos] Se debitaron ${litrosConsumo} L.`);

    // Paso 3: Incorporar labor de aplicación en la ficha de campo
    const resFicha = fichasColl.updateOne(
      { codigo_ficha: codigoFicha },
      {
        $push: {
          labores_aplicadas: {
            tipo_labor: 'Control Fitosanitario Preventivo',
            insumo_sku: skuInsumo,
            cantidad_aplicada: litrosConsumo,
            operador: operador,
            fecha_aplicacion: new Date()
          }
        }
      }
    );
    if (resFicha.modifiedCount !== 1) {
      throw new Error('Fallo al registrar labor en la ficha de campo.');
    }
    print(`    [Update fichas_campo] Labor agregada a la ficha ${codigoFicha}.`);

    // Paso 4: Registro de auditoría
    auditColl.insertOne({
      entidad: 'insumos',
      accion: 'CONSUMO_CAMPO',
      usuario: operador,
      detalles: `Aplicación de ${litrosConsumo} L de ${insumoDoc.nombre} en ${codigoFicha}`,
      timestamp: new Date()
    });
    print('    [Insert auditoria_labores] Evento auditado con éxito.');

    // Paso 5: Commit
    session.commitTransaction();
    print('  ✅ COMMIT EXITOSO: Consumo y aplicación sincronizados atómicamente.');

  } catch (err) {
    session.abortTransaction();
    print(`  ❌ ABORT TRANSACTION: ${err.message}`);
    print('     Ninguna colección sufrió modificaciones parciales.');
  } finally {
    session.endSession();
  }
}

// Escenario 1: Consumo normal de 50 Litros
aplicarTratamientoFitosanitario('FICHA-CAMPO-2026-N10', 'SKU-BIO-FUNGICIDA-01', 50.0, 'Hugo Fernández');

// Verificación post-transacción 1
const stockActual1 = currentDb.insumos.findOne({ sku: 'SKU-BIO-FUNGICIDA-01' }).stock_disponible;
print(`    -> Stock verificado en insumos tras commit: ${stockActual1} L.`);

// Escenario 2: Consumo excesivo (300 Litros > 150 Litros restantes)
aplicarTratamientoFitosanitario('FICHA-CAMPO-2026-N10', 'SKU-BIO-FUNGICIDA-01', 300.0, 'Hugo Fernández');

// Verificación post-transacción 2: Stock intacto
const stockActual2 = currentDb.insumos.findOne({ sku: 'SKU-BIO-FUNGICIDA-01' }).stock_disponible;
print(`    -> Stock verificado tras abort: ${stockActual2} L (Consistencia preservada).`);
