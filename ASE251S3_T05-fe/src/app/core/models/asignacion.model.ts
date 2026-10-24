export interface AsignacionDetalle {
  idAsignacionDetalle?: number;
  idUsuario: string | number;
  nombreCompletoUsuario?: string;
  costoManoObra: number;
}

export interface AsignacionTrabajadores {
  idAsignacionCabecera?: number;
  idActividad: number;
  tipoActividad?: string;
  nombreCultivo?: string;
  fechaAsignacion?: string;
  horasTrabajadas: number;
  costoTotalManoObra?: number;
  observacion?: string;
  estado?: boolean;
  createdAt?: string;
  detalles?: AsignacionDetalle[];
}

export interface AsignacionDetalleDTO {
  idUsuario: string | number;
  costoManoObra: number;
}

export interface AsignacionTrabajadoresDTO {
  idActividad: number;
  horasTrabajadas: number;
  observacion?: string | null;
  detalles: AsignacionDetalleDTO[];
}
