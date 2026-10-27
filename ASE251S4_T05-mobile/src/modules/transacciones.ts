import { ModuloTransaccion } from './types';
import { kilos, numero, soles } from '../utils/formato';

export const TIPOS_ACTIVIDAD = ['Fumigación', 'Riego', 'Fertilización', 'Poda', 'Control Fitosanitario', 'Deshierbo'] as const;

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v));

const cosechas: ModuloTransaccion = {
  clave: 'cosechas',
  titulo: 'Cosechas',
  singular: 'cosecha',
  icono: { name: 'basket-outline', family: 'ionicons' },
  estudiante: 'Cosechas',
  endpoint: '/harvest',
  idKey: 'idHarvest',
  listarPorEstado: () => null, // GET /harvest devuelve todo; se filtra por estado en la app
  rutaEliminar: (id) => ({ path: `/harvest/eliminar/${id}`, method: 'PUT' }),
  rutaRestaurar: (id) => ({ path: `/harvest/restaurar/${id}`, method: 'PUT' }),
  cabecera: [
    { key: 'responsable', label: 'Responsable', tipo: 'texto', requerido: true, maxLength: 100, placeholder: 'Ej. Supervisor de Campo' },
    { key: 'fechaCosecha', label: 'Fecha de cosecha', tipo: 'fecha', requerido: true, placeholder: 'AAAA-MM-DD' },
  ],
  detalle: {
    titulo: 'Cultivos cosechados',
    campos: [
      { key: 'idCultivo', label: 'Cultivo', tipo: 'seleccion', fuente: 'cultivos', requerido: true },
      { key: 'kilosOptimos', label: 'Kilos óptimos', tipo: 'decimal', requerido: true, min: 0 },
      { key: 'kilosMerma', label: 'Kilos de merma', tipo: 'decimal', requerido: true, min: 0 },
    ],
  },
  aFormulario: (r) => ({
    cabecera: { responsable: str(r.responsable), fechaCosecha: str(r.fechaCosecha) },
    detalles: (r.detalles ?? []).map((d: any) => ({
      idCultivo: str(d.idCultivo), kilosOptimos: str(d.kilosOptimos), kilosMerma: str(d.kilosMerma),
    })),
  }),
  resumen: (r) => {
    const total = (r.detalles ?? []).reduce((s: number, d: any) => s + Number(d.totalKilos ?? 0), 0);
    return { titulo: `Cosecha #${r.idHarvest}`, subtitulo: `Responsable: ${r.responsable}`, insignia: r.fechaCosecha, valor: kilos(total),
      detalle: `${(r.detalles ?? []).length} cultivo(s)` };
  },
  filas: (r) => {
    const opt = (r.detalles ?? []).reduce((s: number, d: any) => s + Number(d.kilosOptimos ?? 0), 0);
    const mer = (r.detalles ?? []).reduce((s: number, d: any) => s + Number(d.kilosMerma ?? 0), 0);
    return [['Responsable', r.responsable], ['Fecha', r.fechaCosecha], ['Kilos óptimos', kilos(opt)], ['Kilos merma', kilos(mer)],
      ['Merma %', opt + mer ? `${numero((mer / (opt + mer)) * 100, 1)} %` : '0 %']];
  },
  filasDetalle: (d, etiqueta) => ({ titulo: etiqueta(d.idCultivo) ?? `Cultivo #${d.idCultivo}`, subtitulo: `Óptimo ${kilos(d.kilosOptimos)} · Merma ${kilos(d.kilosMerma)}`, valor: kilos(d.totalKilos) }),
};

const actividades: ModuloTransaccion = {
  clave: 'actividades',
  titulo: 'Actividades',
  singular: 'actividad',
  icono: { name: 'tractor', family: 'material' },
  estudiante: 'Actividades',
  endpoint: '/actividades-cultivos',
  idKey: 'idActividad',
  listarPorEstado: (activos) => `/actividades-cultivos/estado/${activos}`,
  rutaEliminar: (id) => ({ path: `/actividades-cultivos/${id}/eliminar`, method: 'PATCH' }),
  rutaRestaurar: (id) => ({ path: `/actividades-cultivos/${id}/restaurar`, method: 'PATCH' }),
  cabecera: [
    { key: 'idCultivo', label: 'Cultivo', tipo: 'seleccion', fuente: 'cultivos', requerido: true },
    { key: 'tipoActividad', label: 'Tipo de actividad', tipo: 'opciones', requerido: true, opciones: TIPOS_ACTIVIDAD },
    { key: 'descripcion', label: 'Descripción', tipo: 'multilinea' },
  ],
  detalle: {
    titulo: 'Insumos consumidos',
    campos: [
      { key: 'idInsumo', label: 'Insumo', tipo: 'seleccion', fuente: 'insumos', requerido: true },
      { key: 'cantidad', label: 'Cantidad', tipo: 'entero', requerido: true, min: 1 },
    ],
  },
  aFormulario: (r) => ({
    cabecera: { idCultivo: str(r.idCultivo), tipoActividad: str(r.tipoActividad), descripcion: str(r.descripcion) },
    detalles: (r.detalles ?? []).map((d: any) => ({ idInsumo: str(d.idInsumo), cantidad: str(d.cantidad) })),
  }),
  resumen: (r) => ({ titulo: r.tipoActividad, subtitulo: `Cultivo: ${r.nombreCultivo ?? r.idCultivo}`, insignia: r.completado ? 'Completada' : 'Pendiente',
    valor: soles(r.costoTotal), detalle: r.fechaActividad }),
  filas: (r) => [['Cultivo', r.nombreCultivo], ['Tipo', r.tipoActividad], ['Descripción', r.descripcion], ['Fecha', r.fechaActividad],
    ['Costo total', soles(r.costoTotal)], ['Completada', r.completado ? 'Sí' : 'No']],
  filasDetalle: (d) => ({ titulo: d.nombreInsumo ?? d.idInsumo, subtitulo: `${d.cantidad} × ${soles(d.precioUnitario)}`, valor: soles(d.subtotal) }),
};

const asignaciones: ModuloTransaccion = {
  clave: 'asignaciones',
  titulo: 'Asignaciones',
  singular: 'asignación',
  icono: { name: 'person-add-outline', family: 'ionicons' },
  estudiante: 'Asignaciones',
  endpoint: '/asignaciones-trabajadores',
  idKey: 'idAsignacionCabecera',
  listarPorEstado: (activos) => `/asignaciones-trabajadores/estado/${activos}`,
  rutaEliminar: (id) => ({ path: `/asignaciones-trabajadores/${id}/eliminar`, method: 'PATCH' }),
  rutaRestaurar: (id) => ({ path: `/asignaciones-trabajadores/${id}/restaurar`, method: 'PATCH' }),
  cabecera: [
    { key: 'idActividad', label: 'Actividad', tipo: 'seleccion', fuente: 'actividades', requerido: true },
    { key: 'horasTrabajadas', label: 'Horas trabajadas', tipo: 'decimal', requerido: true, min: 0.5, max: 24 },
    { key: 'observacion', label: 'Observación', tipo: 'multilinea' },
  ],
  detalle: {
    titulo: 'Trabajadores',
    campos: [
      { key: 'idUsuario', label: 'Trabajador', tipo: 'seleccion', fuente: 'usuarios', requerido: true },
      { key: 'costoManoObra', label: 'Costo mano de obra (S/)', tipo: 'decimal', requerido: true, min: 0 },
    ],
  },
  aFormulario: (r) => ({
    cabecera: { idActividad: str(r.idActividad), horasTrabajadas: str(r.horasTrabajadas), observacion: str(r.observacion) },
    detalles: (r.detalles ?? []).map((d: any) => ({ idUsuario: str(d.idUsuario), costoManoObra: str(d.costoManoObra) })),
  }),
  resumen: (r) => ({ titulo: `${r.tipoActividad ?? 'Actividad'} · ${r.nombreCultivo ?? ''}`, subtitulo: `${numero(r.horasTrabajadas)} h trabajadas`,
    insignia: `${(r.detalles ?? []).length} trabajador(es)`, valor: soles(r.costoTotalManoObra), detalle: r.fechaAsignacion }),
  filas: (r) => [['Actividad', `${r.tipoActividad ?? ''} (#${r.idActividad})`], ['Cultivo', r.nombreCultivo], ['Fecha', r.fechaAsignacion],
    ['Horas', numero(r.horasTrabajadas)], ['Costo mano de obra', soles(r.costoTotalManoObra)], ['Observación', r.observacion]],
  filasDetalle: (d) => ({ titulo: d.nombreCompletoUsuario ?? d.idUsuario, subtitulo: 'Mano de obra', valor: soles(d.costoManoObra) }),
};

export const TRANSACCIONES: Record<string, ModuloTransaccion> = { cosechas, actividades, asignaciones };
