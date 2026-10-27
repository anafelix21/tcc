import { apiClient } from '../../../services/apiClient';
import { Parcela, ParcelaFormData } from '../types/parcela.types';
import { exportarExcel as expExcel, exportarPdf as expPdf } from '../../../utils/exportUtils';

const ENDPOINT = '/parcelas';

const COLUMNAS_EXPORT = [
  { header: 'CÓDIGO', key: 'id' },
  { header: 'NOMBRE DE PARCELA', key: 'nombre' },
  { header: 'UBICACIÓN', key: 'ubicacion' },
  { header: 'ÁREA (HA)', key: 'areaHectareas' },
  { header: 'TIPO DE SUELO', key: 'tipoSuelo' },
  { header: 'RESPONSABLE', key: 'responsable' },
  { header: 'ESTADO RIEGO', key: 'estadoRiego' },
  { header: 'CULTIVO ACTUAL', key: 'cultivoActual' },
  { header: 'PRODUCCIÓN ESTIMADA', key: 'produccionEstimada' },
];

export const parcelaService = {
  async listar(): Promise<Parcela[]> {
    const data = await apiClient.get<Parcela[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async listarPorEstado(estado: boolean): Promise<Parcela[]> {
    const data = await apiClient.get<Parcela[]>(`${ENDPOINT}/estado/${estado}`);
    return Array.isArray(data) ? data : [];
  },

  async crear(parcela: ParcelaFormData): Promise<Parcela> {
    return await apiClient.post<Parcela>(ENDPOINT, parcela);
  },

  async editar(id: string, parcela: ParcelaFormData): Promise<Parcela> {
    return await apiClient.put<Parcela>(`${ENDPOINT}/${id}`, parcela);
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/eliminar`);
  },

  async restaurar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/restaurar`);
  },

  async exportarExcel(parcelas: Parcela[]) {
    await expExcel(ENDPOINT, 'Parcelas_AgroPacayales', parcelas, COLUMNAS_EXPORT);
  },

  async exportarPdf(parcelas: Parcela[]) {
    await expPdf(ENDPOINT, 'Parcelas_AgroPacayales', 'Catálogo de Parcelas y Sectores Agrícolas', parcelas, COLUMNAS_EXPORT);
  },
};
