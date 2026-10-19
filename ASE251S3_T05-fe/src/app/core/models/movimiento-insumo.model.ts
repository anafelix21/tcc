export interface MovimientoInsumo {
  idMovimiento?: number;
  idInsumo: number;
  nombreInsumo?: string;
  idUsuario: number;
  nombreUsuario?: string;
  tipoMovimiento: string; // ENTRADA, SALIDA
  motivo: string; // COMPRA, DEVOLUCION, DONACION, USO_ACTIVIDAD, MERMA, VENCIMIENTO, PERDIDA
  cantidad: number;
  precioUnitario: number;
  subtotal?: number;
  stockAnterior?: number;
  stockNuevo?: number;
  referencia?: string;
  observacion?: string;
  fechaMovimiento?: string;
}

export interface MovimientoInsumoDTO {
  idInsumo: number;
  idUsuario: number;
  tipoMovimiento: string;
  motivo: string;
  cantidad: number;
  precioUnitario: number;
  referencia?: string | null;
  observacion?: string | null;
}
