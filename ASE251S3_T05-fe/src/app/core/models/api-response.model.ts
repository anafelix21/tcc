/**
 * Modelo base para respuestas del API
 * Gestiona tanto respuestas exitosas como errores
 */
export interface ApiResponse<T> {
  data?: T;
  status: number;
  message?: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

/**
 * Modelo para errores del API
 */
export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

/**
 * Modelo para notificaciones al usuario
 */
export interface Notification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
