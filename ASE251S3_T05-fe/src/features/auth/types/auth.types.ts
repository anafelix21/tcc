export interface AuthUser {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: string;
  estado?: boolean;
}

export interface LoginResponse {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: string;
  token?: string;
  tokenType?: string;
}
