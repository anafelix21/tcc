import { apiClient } from '../../../services/apiClient';
import { Cultivo, CultivoFormData } from '../types/cultivo.types';
import { exportarExcel as expExcel, exportarPdf as expPdf } from '../../../utils/exportUtils';

const ENDPOINT = '/cultivos';

const COLUMNAS_EXPORT = [
  { header: 'CÓDIGO', key: 'id' },
  { header: 'CULTIVO', key: 'nombre' },
  { header: 'TIPO', key: 'tipoCultivo' },
  { header: 'VARIEDAD', key: 'variedad' },
  { header: 'PARCELA', key: 'idParcela' },
  { header: 'FRECUENCIA RIEGO (DÍAS)', key: 'frecuenciaRiegoDias' },
  { header: 'TEMP IDEAL (°C)', key: 'temperaturaIdeal' },
  { header: 'SIEMBRA', key: 'fechaSiembra' },
];

export const cultivoService = {
  async listar(): Promise<Cultivo[]> {
    const data = await apiClient.get<Cultivo[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async listarPorEstado(estado: boolean): Promise<Cultivo[]> {
    const data = await apiClient.get<Cultivo[]>(`${ENDPOINT}/estado/${estado}`);
    return Array.isArray(data) ? data : [];
  },

  async crear(cultivo: CultivoFormData): Promise<Cultivo> {
    return await apiClient.post<Cultivo>(ENDPOINT, cultivo);
  },

  async editar(id: number, cultivo: CultivoFormData): Promise<Cultivo> {
    return await apiClient.put<Cultivo>(`${ENDPOINT}/${id}`, cultivo);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/eliminar`);
  },

  async restaurar(id: number): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/restaurar`);
  },

  async exportarExcel(cultivos: Cultivo[]) {
    await expExcel(ENDPOINT, 'Cultivos_AgroPacayales', cultivos, COLUMNAS_EXPORT);
  },

  async exportarPdf(cultivos: Cultivo[]) {
    await expPdf(ENDPOINT, 'Cultivos_AgroPacayales', 'Ciclos de Cultivo y Fenología Agronómica', cultivos, COLUMNAS_EXPORT);
  },
};
