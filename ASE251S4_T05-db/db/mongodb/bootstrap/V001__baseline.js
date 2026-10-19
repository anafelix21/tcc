// ==============================================================================
// V001__baseline.js — Agro Pacayales S.A.C.
// Línea Base (Versión 1) del Esquema y Colecciones de MongoDB
// ==============================================================================

var adminDb = db.getSiblingDB('admin');
if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
  throw Error('Autenticación MongoDB fallida para V001__baseline');
}

db = db.getSiblingDB(process.env.MONGO_DATABASE || 'agropacayales_db');

print('[V001] Inicializando esquema baseline de agropacayales_db...');

// 1. Creación de colecciones si no existen
const colecciones = ['parcelas', 'insumos', 'cosechas', 'fichas_campo'];
for (const col of colecciones) {
  if (db.getCollectionInfos({ name: col }).length === 0) {
    db.createCollection(col);
    print(`[V001] Colección creada: ${col}`);
  }
}

// 2. Validadores $jsonSchema (Línea Base V1)
db.runCommand({
  collMod: 'parcelas',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'nombre', 'hectareas'],
      properties: {
        _id: { bsonType: 'string', description: 'ID alfanumérico único de la parcela' },
        nombre: { bsonType: 'string', description: 'Nombre descriptivo de la parcela' },
        fundo: { bsonType: 'string' },
        hectareas: { bsonType: ['double', 'int', 'decimal'], minimum: 0.1, description: 'Superficie cultivable > 0' },
        geometriaGeoJSON: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          properties: {
            type: { enum: ['Polygon'] },
            coordinates: { bsonType: 'array' }
          }
        },
        cultivoActual: {
          bsonType: 'object',
          properties: {
            variedad: { bsonType: 'string' },
            anoPlantacion: { bsonType: 'int' }
          }
        }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

db.runCommand({
  collMod: 'insumos',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'nombre', 'categoria', 'unidadMedida'],
      properties: {
        _id: { bsonType: 'string', pattern: '^INS-[A-Z]+-[0-9]{3,}$', description: 'Código sincronizado con SQL Server' },
        nombre: { bsonType: 'string' },
        categoria: {
          enum: ['Biologico', 'Biológico', 'Quimico / Nutricional', 'Químico / Nutricional', 'Fertilizante', 'Insecticida', 'Herramienta']
        },
        unidadMedida: {
          enum: ['Litros', 'Sacos (50kg)', 'Kilos', 'Unidades']
        },
        especificaciones: { bsonType: 'object' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

db.runCommand({
  collMod: 'cosechas',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'id_parcela', 'cultivo', 'totalKilosCampo'],
      properties: {
        _id: { bsonType: 'string', pattern: '^COS-[0-9]{4}-[0-9]{3,}$' },
        id_parcela: { bsonType: 'string' },
        cultivo: { bsonType: 'string' },
        totalKilosCampo: { bsonType: ['double', 'int', 'decimal'], minimum: 0.1 }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

db.runCommand({
  collMod: 'fichas_campo',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['fechaEvaluacion', 'evaluador', 'parcela', 'tipoFicha'],
      properties: {
        fechaEvaluacion: { bsonType: 'date' },
        evaluador: { bsonType: 'string' },
        parcela: { bsonType: 'string' },
        tipoFicha: { enum: ['PLAGAS', 'RIEGO_Y_SUELO', 'FERTILIZACION', 'EVALUACION_FITOSANITARIA'] }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});

// 3. Creación de índices iniciales
db.parcelas.createIndex({ geometriaGeoJSON: '2dsphere' }, { name: 'geo_parcelas_polygon' });
db.insumos.createIndex({ nombre: 1 }, { name: 'idx_insumos_nombre' });
db.cosechas.createIndex({ id_parcela: 1 }, { name: 'idx_cosechas_parcela' });
db.fichas_campo.createIndex({ parcela: 1, fechaEvaluacion: -1 }, { name: 'idx_fichas_parcela_fecha' });

// 4. Semilla de datos base (V1)
const ahora = new Date();

if (db.parcelas.countDocuments() === 0) {
  db.parcelas.insertMany([
    {
      _id: 'PARC-NORTE-A1',
      nombre: 'Sector Norte A1',
      fundo: 'Fundo Principal',
      hectareas: 12.50,
      geometriaGeoJSON: {
        type: 'Polygon',
        coordinates: [[
          [-77.0282, -12.0432],
          [-77.0275, -12.0435],
          [-77.0278, -12.0442],
          [-77.0285, -12.0439],
          [-77.0282, -12.0432]
        ]]
      },
      cultivoActual: { variedad: 'Palto Hass', anoPlantacion: 2021 }
    },
    {
      _id: 'PARC-SUR-B2',
      nombre: 'Sector Sur B2',
      fundo: 'Fundo Valle',
      hectareas: 8.00,
      geometriaGeoJSON: {
        type: 'Polygon',
        coordinates: [[
          [-77.0310, -12.0510],
          [-77.0302, -12.0515],
          [-77.0305, -12.0522],
          [-77.0315, -12.0518],
          [-77.0310, -12.0510]
        ]]
      },
      cultivoActual: { variedad: 'Arándano Biloxi', anoPlantacion: 2022 }
    }
  ]);
  print('[V001] Semilla insertada en coleccion parcelas.');
}

if (db.insumos.countDocuments() === 0) {
  db.insumos.insertMany([
    {
      _id: 'INS-BIO-001',
      nombre: 'Insecticida BioProtect Pro',
      categoria: 'Biológico',
      unidadMedida: 'Litros',
      especificaciones: {
        ingredienteActivo: 'Bacillus thuringiensis 15%',
        dosisHectarea: '2.0 - 2.5 L/ha',
        periodoCarenciaDias: 3,
        plagasObjetivo: ['Mosca de la fruta', 'Polilla del racimo'],
        registroSenasa: 'SENASA-0982-F',
        toxicidad: 'Banda Verde'
      }
    },
    {
      _id: 'INS-FERT-002',
      nombre: 'Fertilizante Foliar NPK 20-20-20',
      categoria: 'Químico / Nutricional',
      unidadMedida: 'Sacos (50kg)',
      especificaciones: {
        composicionQuimica: 'Nitrógeno 20%, Fósforo 20%, Potasio 20%',
        solubilidad: '100% Soluble',
        metodoAplicacion: 'Fertirriego / Aspersión foliar'
      }
    }
  ]);
  print('[V001] Semilla insertada en coleccion insumos.');
}

if (db.cosechas.countDocuments() === 0) {
  db.cosechas.insertOne({
    _id: 'COS-2026-001',
    id_parcela: 'PARC-NORTE-A1',
    cultivo: 'Palto Hass',
    fechaCosecha: ahora,
    totalKilosCampo: 5200.00
  });
  print('[V001] Semilla insertada en coleccion cosechas.');
}

if (db.fichas_campo.countDocuments() === 0) {
  db.fichas_campo.insertOne({
    fechaEvaluacion: ahora,
    evaluador: 'carlos@agro.com',
    parcela: 'PARC-NORTE-A1',
    tipoFicha: 'PLAGAS',
    observaciones: 'Evaluación inicial fitosanitaria de campaña'
  });
  print('[V001] Semilla insertada en coleccion fichas_campo.');
}

print('[V001] Baseline completado exitosamente.');
