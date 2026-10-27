export type TipoInsumo =
  | 'FERTILIZANTE'
  | 'PESTICIDA'
  | 'HERBICIDA'
  | 'FUNGICIDA'
  | 'SEMILLA'
  | 'OTRO';

export type UnidadMedida =
  | 'kg'
  | 'g'
  | 'L'
  | 'ml'
  | 'unidad'
  | 'bolsa'
  | 'saco'
  | 'bidon'
  | 'tonelada';

export interface Insumo {
  id?: string;
  idInsumo?: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  unidadMedida: string;
  tipoInsumo: string;
  proveedor: string;
  presentacion?: string;
  estado: boolean;
  createdAt?: string;
}

export interface InsumoFormData {
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  unidadMedida: string;
  tipoInsumo: string;
  proveedor: string;
  presentacion: string;
}
