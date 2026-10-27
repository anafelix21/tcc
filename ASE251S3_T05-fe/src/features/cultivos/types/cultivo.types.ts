export interface Cultivo {
  idCultivo?: number;
  id?: number;
  nombre: string;
  variedad?: string;
  tipoCultivo?: string;
  idParcela?: string | number;
  fechaSiembra?: string;
  fechaCosechaEstimada?: string;
  requiereSombra?: boolean;
  temperaturaIdeal?: number;
  humedadIdeal?: number;
  frecuenciaRiegoDias?: number;
  observaciones?: string;
  estado?: boolean;
  parcela?: {
    idParcela?: string;
    nombre?: string;
    ubicacion?: string;
  };
}

export interface CultivoFormData {
  nombre: string;
  variedad: string;
  tipoCultivo: string;
  idParcela: string;
  fechaSiembra: string;
  fechaCosechaEstimada: string;
  requiereSombra: boolean;
  temperaturaIdeal: number;
  humedadIdeal: number;
}
