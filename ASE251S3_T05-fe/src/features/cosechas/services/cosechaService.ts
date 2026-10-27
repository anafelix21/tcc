import { apiClient } from '../../../services/apiClient';
import { Cosecha } from '../types/cosecha.types';

const ENDPOINT = '/harvest';

export const cosechaService = {
  async listar(): Promise<Cosecha[]> {
    const data = await apiClient.get<Cosecha[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async listarPorEstado(estado: boolean): Promise<Cosecha[]> {
    const data = await apiClient.get<Cosecha[]>(`${ENDPOINT}/estado/${estado}`);
    return Array.isArray(data) ? data : [];
  },

  async crear(cosecha: Partial<Cosecha>): Promise<Cosecha> {
    return await apiClient.post<Cosecha>(ENDPOINT, cosecha);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/eliminar`);
  },
};
