export type RolUsuario =
  | 'ADMIN'
  | 'SUPERVISOR'
  | 'OPERARIO'
  | 'TECNICO'
  | 'AGRONOMO';

export interface Usuario {
  id?: string;
  idUsuario?: string;
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rol: string;
  fechaNacimiento?: string;
  fechaContratacion?: string;
  telefono?: string;
  estado: boolean;
  createdAt?: string;
}

export interface UsuarioFormData {
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rol: string;
  fechaNacimiento?: string;
  fechaContratacion?: string;
}
