import { UsuarioSesion } from '../models/Usuario';

export function normalizarRol(usuario: UsuarioSesion | null): string {
  if (!usuario || !usuario.rol) return '';
  return usuario.rol.trim().toUpperCase();
}

export function esAdmin(usuario: UsuarioSesion | null): boolean {
  return normalizarRol(usuario) === 'ADMIN';
}

export function esSupervisorOAdmin(usuario: UsuarioSesion | null): boolean {
  const rol = normalizarRol(usuario);
  return ['ADMIN', 'SUPERVISOR', 'SUPERVISOR_ALMACEN'].includes(rol);
}

export function esAgronomo(usuario: UsuarioSesion | null): boolean {
  const rol = normalizarRol(usuario);
  return ['AGRONOMO', 'TECNICO'].includes(rol);
}

export function esOperario(usuario: UsuarioSesion | null): boolean {
  const rol = normalizarRol(usuario);
  return ['OPERARIO', 'OPERADOR', 'TRABAJADOR'].includes(rol);
}

/**
 * Determina si el usuario tiene permisos de edición (crear, modificar, dar de baja, restaurar)
 * sobre los módulos transaccionales (Cosechas, Labores/Actividades, Asignaciones)
 * y los catálogos maestros (Parcelas, Insumos, Usuarios).
 * 
 * Regla de negocio:
 * - ADMIN y SUPERVISOR: Gestión completa (crear, editar, eliminar, restaurar).
 * - AGRÓNOMO y OPERARIO: Únicamente CONSULTA (solo lectura, no pueden editar ni registrar).
 * - MODO INVITADO: Únicamente CONSULTA (solo lectura).
 */
export function puedeGestionarMaestroOTransaccion(usuario: UsuarioSesion | null): boolean {
  return esSupervisorOAdmin(usuario);
}

/**
 * Determina si el usuario tiene permisos para crear y modificar Fichas de Campo
 * (Diario Técnico Agronómico y Evaluaciones Fitosanitarias).
 * 
 * Regla de negocio:
 * - AGRÓNOMO, TÉCNICO, SUPERVISOR y ADMIN: Pueden crear y editar fichas técnicas de campo.
 * - OPERARIO / OPERADOR: Únicamente lectura (solo ver, no editar).
 */
export function puedeGestionarFichasCampo(usuario: UsuarioSesion | null): boolean {
  const rol = normalizarRol(usuario);
  return ['ADMIN', 'SUPERVISOR', 'AGRONOMO', 'TECNICO'].includes(rol);
}
