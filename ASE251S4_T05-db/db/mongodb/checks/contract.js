// ==============================================================================
// contract.js — Verificación de Contrato de Persistencia MongoDB (Team 05)
// ==============================================================================

var adminDb = db.getSiblingDB('admin');
if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
  throw Error('No se pudo autenticar el administrador MongoDB');
}

var labDb = db.getSiblingDB(process.env.MONGO_DATABASE || 'agropacayales_db');
var requested = Number(process.env.TARGET_SCHEMA_VERSION);
var changes = labDb.schema_changes.find().sort({sequence: 1}).toArray();

if (changes.length !== requested || changes[changes.length - 1].sequence !== requested) {
  throw Error('Historial de cambios incompatible con la versión solicitada (registrado: ' + changes.length + ', solicitado: ' + requested + ')');
}

for (var sequence = 1; sequence <= requested; sequence++) {
  if (changes[sequence - 1].sequence !== sequence) {
    throw Error('Falta la secuencia ' + sequence + ' en schema_changes');
  }
}

// Verificación V1 (Baseline)
var coleccionesBase = ['parcelas', 'insumos', 'cosechas', 'fichas_campo'];
for (var col of coleccionesBase) {
  if (labDb.getCollectionInfos({name: col}).length === 0) {
    throw Error('Falta colección base requerida: ' + col);
  }
}

if (labDb.parcelas.countDocuments({_id: 'PARC-NORTE-A1'}) !== 1) {
  throw Error('Semilla de parcela PARC-NORTE-A1 no encontrada');
}

if (labDb.insumos.countDocuments({_id: 'INS-BIO-001'}) !== 1) {
  throw Error('Semilla de insumo INS-BIO-001 no encontrada');
}

// Verificación V2 (Evolución de Modelado de Datos - EMBEDDING)
if (requested >= 2) {
  var parcelaA1 = labDb.parcelas.findOne({_id: 'PARC-NORTE-A1'});
  if (!parcelaA1.condiciones_edaficas || !parcelaA1.condiciones_edaficas.textura) {
    throw Error('V2 requiere subdocumento condiciones_edaficas en parcelas (Hugo Fernández - Ej 1)');
  }
  if (!parcelaA1.dispositivos_iot_instalados || parcelaA1.dispositivos_iot_instalados.length === 0) {
    throw Error('V2 requiere array dispositivos_iot_instalados en parcelas (Hugo Fernández - Ej 2)');
  }
  if (!parcelaA1.sistema_riego || !parcelaA1.sistema_riego.tipo) {
    throw Error('V2 requiere subdocumento sistema_riego en parcelas (Hugo Fernández - Ej 3)');
  }

  var cosecha1 = labDb.cosechas.findOne({_id: 'COS-2026-001'});
  if (!cosecha1.desgloseCalidades || cosecha1.desgloseCalidades.length === 0) {
    throw Error('V2 requiere array desgloseCalidades en cosechas (Ana Félix - Ej 1)');
  }
  if (!cosecha1.control_calidad_laboratorio || !cosecha1.control_calidad_laboratorio.grados_brix) {
    throw Error('V2 requiere subdocumento control_calidad_laboratorio en cosechas (Ana Félix - Ej 2)');
  }

  var insumoBio = labDb.insumos.findOne({_id: 'INS-BIO-001'});
  if (!insumoBio.tabla_dosificacion_cultivo || insumoBio.tabla_dosificacion_cultivo.length === 0) {
    throw Error('V2 requiere array tabla_dosificacion_cultivo en insumos (Ana Félix - Ej 3)');
  }

  var ficha = labDb.fichas_campo.findOne({parcela: 'PARC-NORTE-A1'});
  if (!ficha.protocolo_certificacion || !ficha.protocolo_certificacion.norma) {
    throw Error('V2 requiere subdocumento protocolo_certificacion en fichas_campo (Axel Huapaya - Ej 1)');
  }
  if (!ficha.monitoreo_plagas_evaluadas || ficha.monitoreo_plagas_evaluadas.length === 0) {
    throw Error('V2 requiere array monitoreo_plagas_evaluadas en fichas_campo (Axel Huapaya - Ej 2)');
  }
  if (!parcelaA1.resumen_ultima_campana || !parcelaA1.resumen_ultima_campana.rendimiento_kg_ha) {
    throw Error('V2 requiere subset resumen_ultima_campana en parcelas (Axel Huapaya - Ej 3)');
  }
}

print('MongoDB: contrato V' + requested + ' (EMBEDDING) de agropacayales_db verificado con éxito.');
