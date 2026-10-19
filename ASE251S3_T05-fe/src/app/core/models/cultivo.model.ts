/**
 * Interfaz Cultivo - Sincronizado con backend
 * Coincide exactamente con DTO del backend
 */
export interface Cultivo {
  idCultivo?: number;
  parcela: {
    idParcela: number;
    nombre: string;
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
 * El backend espera el objeto parcela anidado, no un parcelaId plano
 */
export interface CultivoDTO {
  parcela: { idParcela: number };
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
