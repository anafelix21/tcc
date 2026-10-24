// ==============================================================================
// AGROPACAYALES S.A.C. — SCRIPT IDEMPOTENTE MONGODB
// COLECCIONES EN INGLÉS (supplies, users, plots) — DOCUMENTOS EN ESPAÑOL
// IDENTIFICADORES COHERENTES DE NEGOCIO (INS-..., USR-..., PARC-...)
// Restricciones de Esquema ($jsonSchema) + Índices de Unicidad (UNIQUE)
// ==============================================================================

const DB_NAME = 'agropacayales_db';
db = db.getSiblingDB(DB_NAME);

print(`==============================================================================`);
print(`[MONGODB] Inicializando '${DB_NAME}'`);
print(`Estructura: Colecciones en Inglés (supplies, users, plots) con IDs Coherentes`);
print(`==============================================================================`);

// 1. ELIMINACIÓN DE COLECCIONES PREVIAS (Para recreación limpia e idempotente)
const collectionsToDrop = ['insumos', 'parcelas', 'usuarios', 'fichas_campo', 'movimientos_insumo', 'supplies', 'users', 'plots', 'field_records'];
collectionsToDrop.forEach(col => {
  if (db.getCollectionNames().includes(col)) {
    db[col].drop();
    print(`  • Colección previa '${col}' eliminada limpiamente.`);
  }
});

// ==============================================================================
// 1. INTEGRANTE: HUGO FERNÁNDEZ
// Colección: supplies (Insumos Agrícolas)
// Identificadores Coherentes: INS-FERT-001, INS-PEST-002, INS-HERB-003, etc.
// ==============================================================================
db.createCollection('supplies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'nombre', 'precio', 'stock', 'tipo_insumo', 'unidad_medida'],
      properties: {
        _id: {
          bsonType: 'string',
          pattern: '^INS-[A-Z]{3,4}-[0-9]{3,}$',
          description: 'Identificador coherente de insumo (ej: INS-FERT-001)'
        },
        nombre: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 100,
          description: 'Nombre descriptivo del insumo obligatorio'
        },
        descripcion: { bsonType: 'string' },
        precio: {
          bsonType: ['double', 'int', 'decimal'],
          minimum: 0.01,
          description: 'Precio unitario debe ser positivo mayor a 0'
        },
        stock: {
          bsonType: 'int',
          minimum: 0,
          description: 'Stock disponible no puede ser negativo'
        },
        tipo_insumo: {
          enum: ['FERTILIZANTE', 'PESTICIDA', 'HERBICIDA', 'FUNGICIDA', 'SEMILLA', 'OTRO'],
          description: 'Categoría agronómica del insumo'
        },
        unidad_medida: {
          enum: ['kg', 'g', 'L', 'ml', 'unidad', 'bolsa', 'saco', 'bidon', 'tonelada'],
          description: 'Unidad de medida normalizada'
        },
        proveedor: { bsonType: 'string' },
        presentacion: { bsonType: 'string' },
        estado: { bsonType: 'bool' },
        created_at: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});
db.supplies.createIndex({ nombre: 1 }, { unique: true });
print(`  [OK] Colección 'supplies' creada con $jsonSchema e índice UNIQUE.`);

const catalogoInsumos = [
  { nombre: 'Urea Granulada 46% N', tipo: 'FERTILIZANTE', unidad: 'saco', precio: 125.50, code: 'FERT' },
  { nombre: 'Nitrato de Calcio Agrícola', tipo: 'FERTILIZANTE', unidad: 'saco', precio: 110.00, code: 'FERT' },
  { nombre: 'Sulfato de Potasio Soluble', tipo: 'FERTILIZANTE', unidad: 'saco', precio: 195.00, code: 'FERT' },
  { nombre: 'Fosfato Diamónico (DAP)', tipo: 'FERTILIZANTE', unidad: 'saco', precio: 185.00, code: 'FERT' },
  { nombre: 'Glifosato 480 SL', tipo: 'HERBICIDA', unidad: 'L', precio: 42.00, code: 'HERB' },
  { nombre: 'Abamectina 1.8% EC', tipo: 'PESTICIDA', unidad: 'L', precio: 95.00, code: 'PEST' },
  { nombre: 'Azoxistrobina 250 SC', tipo: 'FUNGICIDA', unidad: 'L', precio: 210.00, code: 'FUNG' },
  { nombre: 'Semilla Palto Hass Certificada', tipo: 'SEMILLA', unidad: 'unidad', precio: 18.50, code: 'SEMI' },
  { nombre: 'Plántula Arándano Biloxi', tipo: 'SEMILLA', unidad: 'unidad', precio: 7.20, code: 'SEMI' },
  { nombre: 'Bioestimulante Algas Marinas', tipo: 'OTRO', unidad: 'L', precio: 115.00, code: 'BIO' }
];
const proveedores = ['Fertisur S.A.C.', 'Agroquímica del Perú', 'Yara Perú', 'Bayer Crop Science', 'Syngenta Perú', 'Molinos & Cía'];

const suppliesDocs = [];
for (let i = 1; i <= 200; i++) {
  const base = catalogoInsumos[(i - 1) % catalogoInsumos.length];
  const coherentId = `INS-${base.code}-${i.toString().padStart(3, '0')}`;
  suppliesDocs.push({
    _id: coherentId,
    nombre: `${base.nombre} - Lote ${i.toString().padStart(3, '0')}`,
    descripcion: `Insumo agrícola certificado lote #${i} (${coherentId}) para exportación.`,
    precio: Number((base.precio * (0.9 + (i % 20) * 0.01)).toFixed(2)),
    stock: Number(25 + ((i * 5) % 350)),
    tipo_insumo: base.tipo,
    unidad_medida: base.unidad,
    proveedor: proveedores[i % proveedores.length],
    presentacion: `${base.unidad} industrial certificado`,
    estado: true,
    created_at: new Date('2024-01-10T08:00:00Z')
  });
}
db.supplies.insertMany(suppliesDocs);
print(`  [HUGO FERNÁNDEZ] -> 200 insumos con IDs coherentes (INS-...) insertados en 'supplies'.`);

// ==============================================================================
// 2. INTEGRANTE: AXEL HUAPAYA
// Colección: users (Usuarios del Sistema y Personal de Campo)
// Identificadores Coherentes: USR-ADM-001, USR-SUP-004, USR-OPE-005, etc.
// ==============================================================================
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'nombre', 'apellido', 'correo', 'password', 'rol'],
      properties: {
        _id: {
          bsonType: 'string',
          pattern: '^USR-[A-Z]{3}-[0-9]{3,}$',
          description: 'Identificador coherente de usuario (ej: USR-ADM-001)'
        },
        nombre: { bsonType: 'string', minLength: 2, maxLength: 80 },
        apellido: { bsonType: 'string', minLength: 2, maxLength: 80 },
        correo: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Correo electrónico válido obligatorio'
        },
        password: { bsonType: 'string', minLength: 6 },
        rol: {
          enum: ['ADMIN', 'SUPERVISOR', 'OPERARIO', 'TECNICO', 'AGRONOMO'],
          description: 'Rol institucional restringido'
        },
        fecha_nacimiento: { bsonType: 'string' },
        fecha_contratacion: { bsonType: 'string' },
        estado: { bsonType: 'bool' },
        created_at: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});
db.users.createIndex({ correo: 1 }, { unique: true });
print(`  [OK] Colección 'users' creada con $jsonSchema e índice UNIQUE.`);

const roles = [
  { rol: 'ADMIN', code: 'ADM' },
  { rol: 'SUPERVISOR', code: 'SUP' },
  { rol: 'OPERARIO', code: 'OPE' },
  { rol: 'TECNICO', code: 'TEC' },
  { rol: 'AGRONOMO', code: 'AGR' }
];
const nombres = ['Hugo', 'Ana', 'Axel', 'Carlos', 'Lucia', 'Miguel', 'Rosa', 'Jorge', 'Elena', 'Pedro', 'Sofia', 'Diego'];
const apellidos = ['Fernández', 'Félix', 'Huapaya', 'Mendoza', 'Quispe', 'Ramos', 'Huamán', 'Torres', 'Flores', 'Salazar'];

const usersDocs = [];
// Cuentas de los tres estudiantes con IDs claros
usersDocs.push(
  { _id: 'USR-ADM-001', nombre: 'Hugo', apellido: 'Fernández', correo: 'hugo@agro.com', password: 'Password123!', rol: 'ADMIN', fecha_nacimiento: '1994-05-12', fecha_contratacion: '2020-01-15', estado: true, created_at: new Date() },
  { _id: 'USR-ADM-002', nombre: 'Ana', apellido: 'Félix', correo: 'ana@agro.com', password: 'Password123!', rol: 'ADMIN', fecha_nacimiento: '1996-08-20', fecha_contratacion: '2020-02-01', estado: true, created_at: new Date() },
  { _id: 'USR-ADM-003', nombre: 'Axel', apellido: 'Huapaya', correo: 'axel@agro.com', password: 'Password123!', rol: 'ADMIN', fecha_nacimiento: '1995-11-10', fecha_contratacion: '2020-02-15', estado: true, created_at: new Date() }
);

for (let i = 4; i <= 150; i++) {
  const fn = nombres[(i - 1) % nombres.length];
  const ln = apellidos[(i - 1) % apellidos.length];
  const rObj = roles[i % roles.length];
  const coherentId = `USR-${rObj.code}-${i.toString().padStart(3, '0')}`;
  const userMail = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@agropacayales.com`
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  usersDocs.push({
    _id: coherentId,
    nombre: fn,
    apellido: ln,
    correo: userMail,
    password: 'Password123!',
    rol: rObj.rol,
    fecha_nacimiento: `198${(i % 10)}-0${(i % 9) + 1}-15`,
    fecha_contratacion: `202${(i % 4) + 1}-0${(i % 9) + 1}-01`,
    estado: true,
    created_at: new Date('2024-01-15T08:00:00Z')
  });
}
db.users.insertMany(usersDocs);
print(`  [AXEL HUAPAYA] -> 150 usuarios con IDs coherentes (USR-...) insertados en 'users'.`);

// ==============================================================================
// 3. INTEGRANTE: ANA FÉLIX
// Colección: plots (Parcelas Agrícolas con Modelado Embebido)
// Identificadores Coherentes: PARC-NOR-001, PARC-SUR-002, PARC-CEN-003, etc.
// ==============================================================================
db.createCollection('plots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'nombre', 'area_hectareas', 'tipo_suelo', 'estado_riego'],
      properties: {
        _id: {
          bsonType: 'string',
          pattern: '^PARC-[A-Z]{3}-[0-9]{3,}$',
          description: 'Identificador coherente de parcela (ej: PARC-NOR-001)'
        },
        nombre: { bsonType: 'string', minLength: 3, maxLength: 100 },
        ubicacion: { bsonType: 'string' },
        area_hectareas: {
          bsonType: ['double', 'int', 'decimal'],
          minimum: 0.1,
          description: 'Superficie cultivable mínima de 0.1 hectáreas'
        },
        hectareas: { bsonType: ['double', 'int', 'decimal'] },
        tipo_suelo: {
          enum: ['Franco', 'Franco Arenoso', 'Arenoso', 'Franco Limoso', 'Arcilloso'],
          description: 'Textura del suelo estandarizada'
        },
        responsable: { bsonType: 'string' },
        estado_riego: {
          enum: ['Completo', 'En Proceso', 'Pendiente'],
          description: 'Estado del sistema de riego'
        },
        cultivo_actual: { bsonType: 'string' },
        en_uso: { bsonType: 'bool' },
        estado: { bsonType: 'bool' },
        condiciones_edaficas: {
          bsonType: 'object',
          properties: {
            textura: { bsonType: 'string' },
            ph_promedio: {
              bsonType: ['double', 'int', 'decimal'],
              minimum: 0,
              maximum: 14,
              description: 'pH debe estar en la escala de 0 a 14'
            },
            materia_organica_pct: {
              bsonType: ['double', 'int', 'decimal'],
              minimum: 0,
              maximum: 100,
              description: 'Porcentaje de materia orgánica de 0 a 100%'
            }
          }
        },
        sistema_riego: {
          bsonType: 'object',
          properties: {
            tipo: { enum: ['Goteo', 'Aspersión', 'Gravedad'] },
            caudal_lph: { bsonType: ['double', 'int', 'decimal'], minimum: 0 },
            sector_valvula: { bsonType: 'string' }
          }
        },
        created_at: { bsonType: 'date' }
      }
    }
  },
  validationLevel: 'strict',
  validationAction: 'error'
});
db.plots.createIndex({ nombre: 1 }, { unique: true });
print(`  [OK] Colección 'plots' creada con $jsonSchema e índice UNIQUE.`);

const sectoresInfo = [
  { nombre: 'Sector Norte', code: 'NOR' },
  { nombre: 'Sector Sur', code: 'SUR' },
  { nombre: 'Sector Central', code: 'CEN' },
  { nombre: 'Sector Lomas', code: 'LOM' },
  { nombre: 'Sector San Isidro', code: 'SAN' }
];
const tiposSuelo = ['Franco', 'Franco Arenoso', 'Arenoso', 'Franco Limoso', 'Arcilloso'];
const estadosRiego = ['Completo', 'En Proceso', 'Pendiente'];
const cultivos = ['Palta Hass Exportación', 'Arándano Biloxi', 'Espárrago Verde UC-157', 'Uva de Mesa Red Globe', 'Mandarina W. Murcott'];

const plotsDocs = [];
for (let i = 1; i <= 160; i++) {
  const sInfo = sectoresInfo[(i - 1) % sectoresInfo.length];
  const coherentId = `PARC-${sInfo.code}-${i.toString().padStart(3, '0')}`;
  const area = Number((4.5 + (i % 30) * 0.85).toFixed(2));
  const soilIdx = i % tiposSuelo.length;
  const irriIdx = i % estadosRiego.length;
  const crop = cultivos[i % cultivos.length];
  const ph = Number((6.3 + (i % 15) * 0.1).toFixed(2));
  const mo = Number((1.8 + (i % 20) * 0.08).toFixed(2));
  const caudal = Number((1.2 + (i % 8) * 0.25).toFixed(2));

  plotsDocs.push({
    _id: coherentId,
    nombre: `${sInfo.nombre} - Lote ${i.toString().padStart(3, '0')}`,
    ubicacion: `Fundo AgroPacayales, ${sInfo.nombre}, Km ${115 + (i % 25)} Panamericana Sur`,
    area_hectareas: area,
    hectareas: area,
    tipo_suelo: tiposSuelo[soilIdx],
    responsable: `${nombres[i % nombres.length]} ${apellidos[i % apellidos.length]}`,
    estado_riego: estadosRiego[irriIdx],
    cultivo_actual: crop,
    en_uso: i % 6 !== 0,
    estado: true,
    condiciones_edaficas: {
      textura: tiposSuelo[soilIdx],
      ph_promedio: ph,
      materia_organica_pct: mo
    },
    sistema_riego: {
      tipo: i % 4 === 0 ? 'Aspersión' : 'Goteo',
      caudal_lph: caudal,
      sector_valvula: `VALV-${i.toString().padStart(3, '0')}`
    },
    created_at: new Date('2024-01-20T08:00:00Z')
  });
}
db.plots.insertMany(plotsDocs);
print(`  [ANA FÉLIX] -> 160 parcelas con IDs coherentes (PARC-...) insertadas en 'plots'.`);

// ==============================================================================
// 4. MÓDULO DE INSPECCIÓN AGRONÓMICA MÓVIL
// Colección: field_records (Fichas de Campo y Diagnóstico Agronómico con Foto)
// Identificadores Coherentes: FICH-CAMPO-001, FICH-CAMPO-002, etc.
// ==============================================================================
db.createCollection('field_records', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'codigo_ficha', 'id_cultivo', 'nombre_cultivo', 'id_usuario', 'nombre_usuario', 'etapa_fenologica', 'estado_cultivo'],
      properties: {
        _id: {
          bsonType: 'string',
          pattern: '^FICH-CAMPO-[0-9]{3,}$',
          description: 'Identificador coherente de ficha de campo (ej: FICH-CAMPO-001)'
        },
        codigo_ficha: { bsonType: 'string' },
        id_cultivo: { bsonType: ['int', 'long', 'double'] },
        nombre_cultivo: { bsonType: 'string' },
        id_usuario: { bsonType: 'string' },
        nombre_usuario: { bsonType: 'string' },
        fecha_registro: { bsonType: 'string' },
        etapa_fenologica: { bsonType: 'string' },
        temperatura_amb: { bsonType: ['double', 'int'] },
        humedad_relativa: { bsonType: ['double', 'int'] },
        condicion_clima: { bsonType: 'string' },
        estado_cultivo: { bsonType: 'string' },
        necesita_riego: { bsonType: 'bool' },
        necesita_fumigacion: { bsonType: 'bool' },
        diagnostico: { bsonType: 'string' },
        accion_tomada: { bsonType: 'string' },
        accion_pendiente: { bsonType: 'string' },
        estado: { bsonType: 'bool' }
      }
    }
  }
});
db.field_records.createIndex({ codigo_ficha: 1 }, { unique: true });

const etapasFeno = ['Brotación', 'Floración', 'Cuajado', 'Desarrollo de Fruto', 'Maduración'];
const climasFeno = ['Despejado', 'Soleado', 'Parcialmente Nublado'];
const estadosFeno = ['Óptimo', 'Vigoroso', 'Favorable'];

const fieldRecordsDocs = [];
for (let i = 1; i <= 50; i++) {
  const idCult = ((i - 1) % 50) + 1;
  const coherentId = `FICH-CAMPO-${i.toString().padStart(3, '0')}`;
  fieldRecordsDocs.push({
    _id: coherentId,
    codigo_ficha: `FC-2024-${i.toString().padStart(4, '0')}`,
    id_cultivo: idCult,
    nombre_cultivo: `Cultivo AgroPacayales #${idCult}`,
    id_usuario: `USR-AGR-${(((i - 1) % 20) + 1).toString().padStart(3, '0')}`,
    nombre_usuario: 'Personal Técnico Agronómico',
    fecha_registro: `2024-06-${(((i - 1) % 28) + 1).toString().padStart(2, '0')}`,
    etapa_fenologica: etapasFeno[(i - 1) % etapasFeno.length],
    temperatura_amb: Number((22.0 + (i % 8) * 0.5).toFixed(1)),
    humedad_relativa: Number(65 + (i % 15)),
    condicion_clima: climasFeno[(i - 1) % climasFeno.length],
    estado_cultivo: estadosFeno[(i - 1) % estadosFeno.length],
    necesita_riego: i % 2 === 0,
    necesita_fumigacion: i % 5 === 0,
    diagnostico: 'Monitoreo técnico de campo y evaluación foliar.',
    accion_tomada: 'Ajuste de sector de riego y calibración de goteros.',
    accion_pendiente: 'Seguimiento fenológico en 5 días.',
    estado: true,
    created_at: new Date('2024-06-01T08:00:00Z')
  });
}
db.field_records.insertMany(fieldRecordsDocs);
print(`  [OPERATIVO CAMPO] -> 50 fichas de campo con IDs coherentes (FICH-CAMPO-...) insertadas en 'field_records'.`);

// ==============================================================================
// RESUMEN FINAL
// ==============================================================================
print(`==============================================================================`);
print(`¡MONGODB POBLADO CON IDENTIFICADORES COHERENTES Y SOLO COLECCIONES EN INGLÉS!`);
print(`==============================================================================`);
db.getCollectionNames().sort().forEach(c => {
  print(`  • ${c.padEnd(15)} : ${db[c].countDocuments()} documentos`);
});
print(`==============================================================================`);
