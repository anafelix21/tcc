import { createContext, ReactNode, useContext, useState } from 'react';
import { authService } from '../services/authService';
import { setAuthToken } from '../services/apiClient';
import { UsuarioSesion } from '../models/Usuario';

type AuthState = {
  usuario: UsuarioSesion | null;
  iniciarSesion: (correo: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  const iniciarSesion = async (correo: string, password: string) => {
    const sesion = await authService.login(correo.trim(), password);
    setAuthToken(sesion.token);
    setUsuario(sesion);
  };

  const cerrarSesion = () => {
    setAuthToken(null);
    setUsuario(null);
  };

  return <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
