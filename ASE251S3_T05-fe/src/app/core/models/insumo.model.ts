/**
 * Interfaz Insumo - Sincronizado con backend
 * Coincide exactamente con el modelo del backend Insumo.java
 */
export interface Insumo {
  idInsumo?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  unidadMedida: string;
  tipoInsumo: 'FERTILIZANTE' | 'PESTICIDA' | 'HERBICIDA' | 'FUNGICIDA' | 'SEMILLA' | 'OTRO';
  proveedor: string;
  presentacion: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

/**
 * DTO para crear/editar insumos
 */
export interface InsumoDTO {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  unidadMedida: string;
  tipoInsumo: 'FERTILIZANTE' | 'PESTICIDA' | 'HERBICIDA' | 'FUNGICIDA' | 'SEMILLA' | 'OTRO';
  proveedor: string;
  presentacion: string;
}

/**
 * Insumo para formularios
 */
export interface InsumoForm extends InsumoDTO {
  idInsumo?: number;
}
