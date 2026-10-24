/**
 * Interfaz Cultivo - Sincronizado con backend
 * Coincide exactamente con DTO del backend
 */
export interface Cultivo {
  idCultivo?: number;
  idParcela?: string;
  parcela?: {
    idParcela?: any;
    nombre?: string;
  };
  nombre: string;
  tipoCultivo: string;
  frecuenciaRiegoDias: number;
  temperaturaIdeal: number;
  fechaSiembra?: string;
  requiereSombra: boolean;
  observaciones?: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

/**
 * DTO para crear/editar cultivos
 */
export interface CultivoDTO {
  idParcela?: string;
  parcela?: { idParcela?: any };
  nombre: string;
  tipoCultivo: string;
  frecuenciaRiegoDias: number;
  temperaturaIdeal: number;
  fechaSiembra?: string | null;
  requiereSombra: boolean;
  observaciones?: string | null;
}

/**
 * Cultivo para formularios
 */
export interface CultivoForm extends CultivoDTO {
  idCultivo?: number;
}
