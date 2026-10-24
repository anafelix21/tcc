export interface FichaCampo {
  idFicha?: number | string;
  id?: string;
  codigoFicha?: string;
  idCultivo: number;
  nombreCultivo?: string;
  idUsuario: number | string;
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
  fotoUrl?: string;
  estado?: boolean;
}

export interface FichaCampoDTO {
  idCultivo: number;
  idUsuario: number | string;
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
  fotoUrl?: string | null;
}
