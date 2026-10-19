/**
 * Interfaz Parcela - Sincronizado con backend
 * Coincide exactamente con DTO del backend
 */
export interface Parcela {
  idParcela?: number;
  nombre: string;
  ubicacion: string;
  areaHectareas: number;
  tipoSuelo: string;
  responsable: string;
  estadoRiego: string;
  fechaUltimaSiembra?: string;
  produccionEstimada: string;
  cultivoActual: string;
  observaciones?: string;
  enUso: boolean;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

/**
 * DTO para crear/editar parcelas
 */
export interface ParcelaDTO {
  nombre: string;
  ubicacion: string;
  areaHectareas: number;
  tipoSuelo: string;
  responsable: string;
  estadoRiego: string;
  fechaUltimaSiembra?: string;
  produccionEstimada: string;
  cultivoActual?: string;
  observaciones?: string;
  enUso?: boolean;
}

/**
 * Parcela para formularios con validaciones
 */
export interface ParcelaForm extends ParcelaDTO {
  idParcela?: number;
}
