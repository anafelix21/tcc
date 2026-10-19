export interface DetalleCosecha {
  idHarvestDetail?: number;
  idCultivo: number;
  kilosOptimos: number;
  kilosMerma: number;
  totalKilos?: number;
}

export interface Harvest {
  idHarvest?: number;
  responsable: string;
  fechaCosecha: string; // yyyy-MM-dd
  estado?: boolean;
  createdAt?: string;
  detalles: DetalleCosecha[];
}

export interface HarvestDTO {
  responsable: string;
  fechaCosecha: string;
  detalles: DetalleCosecha[];
}
