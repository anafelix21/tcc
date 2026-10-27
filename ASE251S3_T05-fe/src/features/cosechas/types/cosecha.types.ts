export interface CosechaDetalle {
  idDetalleHarvest?: number;
  idCultivo?: number;
  kilosOptimos: number;
  kilosMerma: number;
  totalKilos?: number;
  porcentajeMerma?: number;
}

export interface Cosecha {
  idHarvest?: number;
  id?: number;
  fechaCosecha: string;
  responsable: string;
  observaciones?: string;
  estado?: boolean;
  detalles?: CosechaDetalle[];
}
