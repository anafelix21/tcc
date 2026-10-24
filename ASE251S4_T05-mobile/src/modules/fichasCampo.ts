import { Campo, IconoDef, Registro, Resumen } from './types';
import { siNo } from '../utils/formato';

export const ETAPAS_FENOLOGICAS = [
  'GERMINACION',
  'CRECIMIENTO',
  'FLORACION',
  'FRUCTIFICACION',
  'COSECHA',
  'POST-COSECHA'
] as const;

export const ESTADOS_CULTIVO = ['OPTIMO', 'REGULAR', 'CRITICO'] as const;

export const CONDICIONES_CLIMA = ['SOLEADO', 'NUBLADO', 'LLUVIOSO', 'VENTOSO'] as const;

export interface ModuloFichaCampo {
  clave: 'fichas-campo';
  titulo: string;
  singular: string;
  icono: IconoDef;
  endpoint: string;
  idKey: string;
  campos: Campo[];
  resumen: (r: Registro) => Resumen;
  filas: (r: Registro) => [string, unknown][];
}

export const FICHAS_CAMPO_MODULO: ModuloFichaCampo = {
  clave: 'fichas-campo',
  titulo: 'Fichas de Campo',
  singular: 'ficha de campo',
  icono: { name: 'clipboard-outline', family: 'ionicons' },
  endpoint: '/fichas-campo',
  idKey: 'id',
  campos: [
    { key: 'codigoFicha', label: 'Código de Ficha', tipo: 'texto', maxLength: 50, placeholder: 'Ej. FC-2026-001' },
    { key: 'idCultivo', label: 'Cultivo evaluado', tipo: 'seleccion', fuente: 'cultivos', requerido: true },
    { key: 'idUsuario', label: 'Agrónomo / Evaluador', tipo: 'seleccion', fuente: 'usuarios', requerido: true },
    { key: 'fechaRegistro', label: 'Fecha de evaluación', tipo: 'fecha', requerido: true, placeholder: 'AAAA-MM-DD' },
    { key: 'etapaFenologica', label: 'Etapa Fenológica', tipo: 'opciones', requerido: true, opciones: ETAPAS_FENOLOGICAS },
    { key: 'estadoCultivo', label: 'Estado del Cultivo', tipo: 'opciones', requerido: true, opciones: ESTADOS_CULTIVO },
    { key: 'condicionClima', label: 'Condición del Clima', tipo: 'opciones', requerido: true, opciones: CONDICIONES_CLIMA },
    { key: 'temperaturaAmb', label: 'Temperatura ambiente (°C)', tipo: 'decimal', min: -5, max: 55, placeholder: '22.5' },
    { key: 'humedadRelativa', label: 'Humedad relativa (%)', tipo: 'decimal', min: 0, max: 100, placeholder: '65.0' },
    { key: 'necesitaRiego', label: '¿Requiere Riego Urgente?', tipo: 'booleano' },
    { key: 'necesitaFumigacion', label: '¿Requiere Fumigación / Tratamiento?', tipo: 'booleano' },
    { key: 'diagnostico', label: 'Diagnóstico fitosanitario', tipo: 'multilinea', maxLength: 1000, placeholder: 'Observaciones sobre plagas, vigor, follaje...' },
    { key: 'accionTomada', label: 'Acción tomada en campo', tipo: 'multilinea', maxLength: 1000, placeholder: 'Medidas correctivas aplicadas en la visita...' },
    { key: 'accionPendiente', label: 'Acciones pendientes / Recomendación', tipo: 'multilinea', maxLength: 1000, placeholder: 'Indicaciones para el supervisor y operarios...' },
  ],
  resumen: (r: Registro) => {
    const cod = r.codigoFicha || `Ficha #${(r.idFicha || r.id || '').toString().slice(-6)}`;
    const cultivo = r.nombreCultivo ? `Cultivo: ${r.nombreCultivo}` : (r.idCultivo ? `Cultivo #${r.idCultivo}` : 'Sin cultivo');
    const alertas = [
      r.necesitaRiego ? 'Riego' : null,
      r.necesitaFumigacion ? 'Fumigación' : null,
    ].filter(Boolean).join(' + ');

    return {
      titulo: cod,
      subtitulo: `${cultivo} · ${r.etapaFenologica ?? 'Evaluación'}`,
      insignia: r.estadoCultivo ?? 'EVALUADO',
      valor: r.fechaRegistro ?? '',
      detalle: alertas ? `Alerta: ${alertas}` : 'Condición estable',
    };
  },
  filas: (r: Registro) => [
    ['Código', r.codigoFicha],
    ['Cultivo', r.nombreCultivo ?? (r.idCultivo ? `#${r.idCultivo}` : '—')],
    ['Evaluador', r.nombreUsuario ?? (r.idUsuario ? `#${r.idUsuario}` : '—')],
    ['Fecha de Registro', r.fechaRegistro],
    ['Etapa Fenológica', r.etapaFenologica],
    ['Estado del Cultivo', r.estadoCultivo],
    ['Clima', r.condicionClima],
    ['Temperatura Ambiente', r.temperaturaAmb != null ? `${r.temperaturaAmb} °C` : '—'],
    ['Humedad Relativa', r.humedadRelativa != null ? `${r.humedadRelativa} %` : '—'],
    ['Requiere Riego', siNo(r.necesitaRiego)],
    ['Requiere Fumigación', siNo(r.necesitaFumigacion)],
    ['Diagnóstico', r.diagnostico],
    ['Acción Tomada', r.accionTomada],
    ['Acción Pendiente', r.accionPendiente],
  ],
};
