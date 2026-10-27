import { apiClient } from '../../../services/apiClient';

export interface FichaCampo {
  id?: string;
  _id?: string;
  codigoFicha: string;
  idCultivo?: number;
  nombreCultivo?: string;
  idUsuario?: string;
  responsableTecnico: string;
  fechaRegistro: string;
  etapaFenologica: string;
  temperaturaAmb?: number;
  humedadRelativa?: number;
  condicionClima?: string;
  estadoCultivo?: string;
  necesitaRiego?: boolean;
  necesitaFumigacion?: boolean;
  diagnostico?: string;
  accionTomada?: string;
  accionPendiente?: string;
  observaciones?: string;
  estado?: boolean;
}

const ENDPOINT = '/fichas-campo';

export const fichaCampoService = {
  async listar(): Promise<FichaCampo[]> {
    const data = await apiClient.get<FichaCampo[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async obtenerPorId(id: string): Promise<FichaCampo | null> {
    return await apiClient.get<FichaCampo>(`${ENDPOINT}/${id}`);
  }
};
