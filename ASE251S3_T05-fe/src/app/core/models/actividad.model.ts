export interface DetalleActividad {
  idDetalle?: number;
  idInsumo: string | number;
  nombreInsumo?: string;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
}

export interface ActividadCultivo {
  idActividad?: number;
  idCultivo: number;
  nombreCultivo?: string;
  tipoActividad: string;
  descripcion?: string;
  fechaActividad?: string;
  costoTotal?: number;
  estado?: boolean;
  completado?: boolean;
  detalles: DetalleActividad[];
}

export interface ActividadCultivoDTO {
  idCultivo: number;
  idUsuario?: string | number;
  tipoActividad: string;
  descripcion?: string | null;
  detalles: DetalleActividad[];
}
