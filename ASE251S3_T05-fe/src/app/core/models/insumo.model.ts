/**
 * Interfaz Insumo - Sincronizado con backend
 * Coincide exactamente con el modelo del backend Insumo.java
 */
export interface Insumo {
  id?: string;
  idInsumo?: any;
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

export interface InsumoForm extends InsumoDTO {
  id?: string;
  idInsumo?: any;
}

/**
 * Resultado de importación masiva de insumos
 */
export interface ImportResult {
  totalFilas: number;
  importados: number;
  fallidos: number;
  errores: string[];
}
