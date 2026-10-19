export interface FichaCampo {
  idFicha?: number;
  idCultivo: number;
  nombreCultivo?: string;
  idUsuario: number;
  nombreUsuario?: string;
  fechaRegistro?: string;
  etapaFenologica: string;
  temperaturaAmb?: number;
  humedadRelativa?: number;
  condicionClima?: string;
  estadoCultivo: string;
  necesitaRiego: boolean;
  necesitaFumigacion: boolean;
  diagnostico?: string;
  accionTomada?: string;
  accionPendiente?: string;
  estado?: boolean;
}

export interface FichaCampoDTO {
  idCultivo: number;
  idUsuario: number;
  etapaFenologica: string;
  temperaturaAmb?: number | null;
  humedadRelativa?: number | null;
  condicionClima?: string | null;
  estadoCultivo: string;
  necesitaRiego: boolean;
  necesitaFumigacion: boolean;
  diagnostico?: string | null;
  accionTomada?: string | null;
  accionPendiente?: string | null;
}
