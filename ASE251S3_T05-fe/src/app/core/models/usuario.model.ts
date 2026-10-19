/**
 * Interfaz Usuario - Sincronizado con backend
 * Coincide exactamente con DTO del backend
 */
export interface Usuario {
  idUsuario?: number;
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'TRABAJADOR';
  fechaNacimiento?: string; // ← Agregado
  fechaContratacion?: string;
  estado: boolean;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
  restoredAt?: string | null;
}

/**
 * DTO para crear/editar usuarios
 */
export interface UsuarioDTO {
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'TRABAJADOR';
  fechaNacimiento?: string; // ← Agregado
  fechaContratacion?: string;
}

/**
 * Usuario para formularios
 */
export interface UsuarioForm extends UsuarioDTO {
  passwordConfirmation?: string;
}
