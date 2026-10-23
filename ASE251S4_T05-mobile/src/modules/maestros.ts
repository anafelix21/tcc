import { ModuloMaestro } from './types';
import { siNo, soles } from '../utils/formato';

export const TIPOS_INSUMO = ['FERTILIZANTE', 'PESTICIDA', 'HERBICIDA', 'FUNGICIDA', 'SEMILLA', 'OTRO'] as const;
export const UNIDADES_MEDIDA = ['kg', 'g', 'L', 'ml', 'unidad', 'bolsa', 'saco', 'bidon', 'tonelada'] as const;
export const TIPOS_SUELO = ['Arcilloso', 'Arenoso', 'Franco', 'Limoso', 'Franco Arenoso', 'Franco Limoso', 'Arcillo Limoso'] as const;
export const ESTADOS_RIEGO = ['Completo', 'En Proceso', 'Pendiente'] as const;
export const ROLES = ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN', 'OPERADOR', 'OPERARIO', 'TECNICO', 'AGRONOMO'] as const;

const insumos: ModuloMaestro = {
  clave: 'insumos',
  titulo: 'Insumos',
  singular: 'insumo',
  icono: '🧪',
  endpoint: '/insumos',
  notaEliminar: 'Solo se puede eliminar un insumo con stock 0. Edítelo y deje el stock en 0 antes de eliminarlo.',
  campos: [
    { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100, placeholder: 'Ej. Urea' },
    { key: 'descripcion', label: 'Descripción', tipo: 'multilinea', maxLength: 1000 },
    { key: 'precio', label: 'Precio (S/)', tipo: 'decimal', requerido: true, min: 0.01, max: 50000, placeholder: '0.00' },
    { key: 'stock', label: 'Stock', tipo: 'entero', requerido: true, min: 0, placeholder: '0' },
    { key: 'tipoInsumo', label: 'Tipo de insumo', tipo: 'opciones', requerido: true, opciones: TIPOS_INSUMO },
    { key: 'unidadMedida', label: 'Unidad de medida', tipo: 'opciones', requerido: true, opciones: UNIDADES_MEDIDA },
    { key: 'proveedor', label: 'Proveedor', tipo: 'texto', maxLength: 100, placeholder: 'Ej. Fertisur' },
    { key: 'presentacion', label: 'Presentación', tipo: 'texto', maxLength: 100, placeholder: 'Ej. Saco 50kg' },
  ],
  resumen: (r) => ({
    titulo: r.nombre,
    subtitulo: r.proveedor ? `Proveedor: ${r.proveedor}` : undefined,
    insignia: r.tipoInsumo,
    valor: soles(r.precio),
    detalle: `Stock: ${r.stock} ${r.unidadMedida}`,
  }),
  filas: (r) => [
    ['Descripción', r.descripcion], ['Tipo', r.tipoInsumo], ['Precio', soles(r.precio)],
    ['Stock', `${r.stock} ${r.unidadMedida}`], ['Proveedor', r.proveedor], ['Presentación', r.presentacion],
  ],
};

const parcelas: ModuloMaestro = {
  clave: 'parcelas',
  titulo: 'Parcelas',
  singular: 'parcela',
  icono: '🌾',
  endpoint: '/parcelas',
  campos: [
    { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100, placeholder: 'Ej. Parcela Norte 1' },
    { key: 'ubicacion', label: 'Ubicación', tipo: 'texto', maxLength: 200, placeholder: 'Ej. Sector A - Lote 1' },
    { key: 'areaHectareas', label: 'Área (hectáreas)', tipo: 'decimal', requerido: true, min: 0.01, placeholder: '0.0' },
    { key: 'tipoSuelo', label: 'Tipo de suelo', tipo: 'opciones', requerido: true, opciones: TIPOS_SUELO },
    { key: 'estadoRiego', label: 'Estado de riego', tipo: 'opciones', requerido: true, opciones: ESTADOS_RIEGO },
    { key: 'responsable', label: 'Responsable', tipo: 'texto', maxLength: 100 },
    { key: 'cultivoActual', label: 'Cultivo actual', tipo: 'texto', maxLength: 100, placeholder: 'Ej. Palta Hass' },
    { key: 'fechaUltimaSiembra', label: 'Fecha última siembra', tipo: 'fecha', placeholder: 'AAAA-MM-DD' },
    { key: 'produccionEstimada', label: 'Producción estimada', tipo: 'texto', maxLength: 100, placeholder: 'Ej. 50 toneladas' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'multilinea' },
    // Subdocumentos embebidos (modelado V002 de MongoDB)
    { key: 'condicionesEdaficas.phPromedio', label: 'Suelo: pH promedio', tipo: 'decimal', min: 0, max: 14, placeholder: '7.0' },
    { key: 'condicionesEdaficas.materiaOrganicaPct', label: 'Suelo: materia orgánica (%)', tipo: 'decimal', min: 0, max: 100, placeholder: '2.5' },
    { key: 'sistemaRiego.tipo', label: 'Riego: tipo de sistema', tipo: 'opciones', opciones: ['Goteo', 'Aspersión', 'Gravedad', 'Microaspersión'] },
    { key: 'sistemaRiego.caudalLph', label: 'Riego: caudal (L/h)', tipo: 'decimal', min: 0, placeholder: '1.6' },
    { key: 'sistemaRiego.sectorValvula', label: 'Riego: sector / válvula', tipo: 'texto', maxLength: 20, placeholder: 'V-01' },
    { key: 'enUso', label: 'Parcela en uso', tipo: 'booleano' },
  ],
  resumen: (r) => ({
    titulo: r.nombre,
    subtitulo: r.ubicacion,
    insignia: r.tipoSuelo,
    valor: `${r.areaHectareas ?? 0} ha`,
    detalle: `Riego: ${r.estadoRiego ?? '—'} · ${r.enUso ? 'En uso' : 'Libre'}`,
  }),
  filas: (r) => [
    ['Ubicación', r.ubicacion], ['Área', `${r.areaHectareas ?? 0} ha`], ['Tipo de suelo', r.tipoSuelo],
    ['Estado de riego', r.estadoRiego], ['Responsable', r.responsable], ['Cultivo actual', r.cultivoActual],
    ['Última siembra', r.fechaUltimaSiembra], ['Producción estimada', r.produccionEstimada],
    ['En uso', siNo(r.enUso)], ['Observaciones', r.observaciones],
    ['Suelo (embebido)', r.condicionesEdaficas ? `${r.condicionesEdaficas.textura} · pH ${r.condicionesEdaficas.phPromedio} · MO ${r.condicionesEdaficas.materiaOrganicaPct}%` : null],
    ['Riego (embebido)', r.sistemaRiego ? `${r.sistemaRiego.tipo} · ${r.sistemaRiego.caudalLph} L/h · ${r.sistemaRiego.sectorValvula}` : null],
  ],
};

const usuarios: ModuloMaestro = {
  clave: 'usuarios',
  titulo: 'Usuarios',
  singular: 'usuario',
  icono: '👩‍🌾',
  endpoint: '/usuarios',
  campos: [
    { key: 'nombre', label: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 },
    { key: 'apellido', label: 'Apellido', tipo: 'texto', requerido: true, maxLength: 100 },
    { key: 'correo', label: 'Correo', tipo: 'email', requerido: true, maxLength: 100, placeholder: 'usuario@agro.com' },
    { key: 'password', label: 'Contraseña', tipo: 'password', requeridoAlCrear: true, placeholder: 'En edición, vacío = no cambiar' },
    { key: 'rol', label: 'Rol', tipo: 'opciones', requerido: true, opciones: ROLES },
    { key: 'fechaNacimiento', label: 'Fecha de nacimiento', tipo: 'fecha', placeholder: 'AAAA-MM-DD' },
    { key: 'fechaContratacion', label: 'Fecha de contratación', tipo: 'fecha', placeholder: 'AAAA-MM-DD' },
  ],
  resumen: (r) => ({
    titulo: `${r.nombre ?? ''} ${r.apellido ?? ''}`.trim(),
    subtitulo: r.correo,
    insignia: r.rol,
    detalle: r.fechaContratacion ? `Contratado: ${r.fechaContratacion}` : undefined,
  }),
  filas: (r) => [
    ['Correo', r.correo], ['Rol', r.rol], ['Fecha de nacimiento', r.fechaNacimiento], ['Fecha de contratación', r.fechaContratacion],
  ],
};

export const MAESTROS: Record<string, ModuloMaestro> = { insumos, parcelas, usuarios };
