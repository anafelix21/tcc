import { apiClient } from '../../../services/apiClient';

export interface DetalleInsumoActividad {
  idDetalle?: number;
  idInsumo: string;
  nombreInsumo?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface ActividadCultivo {
  idActividad: number;
  id?: number;
  idCultivo: number;
  nombreCultivo?: string;
  tipoActividad: string;
  descripcion?: string;
  fechaActividad?: string;
  fechaProgramada?: string;
  fechaRealizada?: string;
  costoTotal: number;
  estado: boolean;
  completado: boolean;
  alertaFitosanitariaIot?: boolean;
  alertaFitosanitaria?: boolean;
  detalles?: DetalleInsumoActividad[];
}

export const actividadService = {
  async listar(): Promise<ActividadCultivo[]> {
    try {
      const data = await apiClient.get<ActividadCultivo[]>('/actividades-cultivos');
      return Array.isArray(data) ? data : [];
    } catch {
      const altData = await apiClient.get<ActividadCultivo[]>('/actividades');
      return Array.isArray(altData) ? altData : [];
    }
  },

  async obtenerPorId(id: number): Promise<ActividadCultivo | null> {
    try {
      return await apiClient.get<ActividadCultivo>(`/actividades/${id}`);
    } catch {
      return await apiClient.get<ActividadCultivo>(`/actividades-cultivos/${id}`);
    }
  }
};
