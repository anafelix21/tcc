export type TipoSuelo =
  | 'Franco'
  | 'Franco Arenoso'
  | 'Arenoso'
  | 'Franco Limoso'
  | 'Arcilloso';

export type EstadoRiego = 'Completo' | 'En Proceso' | 'Pendiente';

export interface Parcela {
  id?: string;
  idParcela?: string;
  nombre: string;
  ubicacion?: string;
  areaHectareas: number;
  tipoSuelo: string;
  responsable?: string;
  estadoRiego: string;
  cultivoActual?: string;
  produccionEstimada?: string;
  observaciones?: string;
  enUso?: boolean;
  estado: boolean;
  createdAt?: string;
  fechaUltimaSiembra?: string;
}

export interface ParcelaFormData {
  nombre: string;
  ubicacion: string;
  areaHectareas: number;
  tipoSuelo: string;
  responsable: string;
  estadoRiego: string;
  cultivoActual: string;
  produccionEstimada: string;
  observaciones: string;
}
