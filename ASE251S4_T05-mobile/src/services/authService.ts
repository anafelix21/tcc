import { api } from './apiClient';
import { UsuarioSesion } from '../models/Usuario';

export const authService = {
  login: (correo: string, password: string) =>
    api<UsuarioSesion>('/auth/login', { method: 'POST', body: JSON.stringify({ correo, password }) }),
};
