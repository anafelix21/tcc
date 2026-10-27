import { apiClient } from '../../../services/apiClient';

export interface DetalleOperarioAsignacion {
  idDetalle?: number;
  idUsuario: string;
  nombreOperario?: string;
  rolEnCuadrilla: string;
  costoHora: number;
  subtotal: number;
}

export interface AsignacionCabecera {
  idAsignacion?: number;
  id?: number;
  idActividad?: number;
  tipoActividad?: string;
  fechaAsignacion: string;
  horasTrabajadas: number;
  costoTotalManoObra: number;
  supervisorResponsable?: string;
  observacion?: string;
  estado: boolean;
  detalles?: DetalleOperarioAsignacion[];
}

const ENDPOINT = '/asignaciones';

export const asignacionService = {
  async listar(): Promise<AsignacionCabecera[]> {
    try {
      const data = await apiClient.get<AsignacionCabecera[]>(ENDPOINT);
      return Array.isArray(data) ? data : [];
    } catch {
      const altData = await apiClient.get<AsignacionCabecera[]>('/asignaciones-trabajadores');
      return Array.isArray(altData) ? altData : [];
    }
  },

  async obtenerPorId(id: number): Promise<AsignacionCabecera | null> {
    try {
      return await apiClient.get<AsignacionCabecera>(`${ENDPOINT}/${id}`);
    } catch {
      return await apiClient.get<AsignacionCabecera>(`/asignaciones-trabajadores/${id}`);
    }
  }
};
