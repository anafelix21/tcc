import { apiClient } from '../../../services/apiClient';
import { Insumo, InsumoFormData } from '../types/insumo.types';
import { exportarExcel as expExcel, exportarPdf as expPdf } from '../../../utils/exportUtils';

const ENDPOINT = '/insumos';

const COLUMNAS_EXPORT = [
  { header: 'CÓDIGO', key: 'id' },
  { header: 'NOMBRE INSUMO', key: 'nombre' },
  { header: 'CATEGORÍA', key: 'tipoInsumo' },
  { header: 'PRECIO (S/.)', key: 'precio' },
  { header: 'STOCK', key: 'stock' },
  { header: 'UNIDAD', key: 'unidadMedida' },
  { header: 'PROVEEDOR', key: 'proveedor' },
];

export const insumoService = {
  async listar(): Promise<Insumo[]> {
    const data = await apiClient.get<Insumo[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async listarPorEstado(estado: boolean): Promise<Insumo[]> {
    const data = await apiClient.get<Insumo[]>(`${ENDPOINT}/estado/${estado}`);
    return Array.isArray(data) ? data : [];
  },

  async crear(insumo: InsumoFormData): Promise<Insumo> {
    return await apiClient.post<Insumo>(ENDPOINT, insumo);
  },

  async editar(id: string, insumo: InsumoFormData): Promise<Insumo> {
    return await apiClient.put<Insumo>(`${ENDPOINT}/${id}`, insumo);
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/eliminar`);
  },

  async restaurar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/restaurar`);
  },

  async exportarExcel(insumos: Insumo[]) {
    await expExcel(ENDPOINT, 'Insumos_AgroPacayales', insumos, COLUMNAS_EXPORT);
  },

  async exportarPdf(insumos: Insumo[]) {
    await expPdf(ENDPOINT, 'Insumos_AgroPacayales', 'Catálogo Oficial de Insumos Agrícolas', insumos, COLUMNAS_EXPORT);
  },
};
