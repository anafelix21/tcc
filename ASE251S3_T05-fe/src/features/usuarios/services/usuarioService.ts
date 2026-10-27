import { apiClient } from '../../../services/apiClient';
import { Usuario, UsuarioFormData } from '../types/usuario.types';
import { exportarExcel as expExcel, exportarPdf as expPdf } from '../../../utils/exportUtils';

const ENDPOINT = '/usuarios';

const COLUMNAS_EXPORT = [
  { header: 'CÓDIGO', key: 'id' },
  { header: 'NOMBRES', key: 'nombre' },
  { header: 'APELLIDOS', key: 'apellido' },
  { header: 'CORREO CORPORATIVO', key: 'correo' },
  { header: 'ROL', key: 'rol' },
  { header: 'TELÉFONO', key: 'telefono' },
  { header: 'FECHA CONTRATACIÓN', key: 'fechaContratacion' },
];

export const usuarioService = {
  async listar(): Promise<Usuario[]> {
    const data = await apiClient.get<Usuario[]>(ENDPOINT);
    return Array.isArray(data) ? data : [];
  },

  async listarPorEstado(estado: boolean): Promise<Usuario[]> {
    const data = await apiClient.get<Usuario[]>(`${ENDPOINT}/estado/${estado}`);
    return Array.isArray(data) ? data : [];
  },

  async crear(usuario: UsuarioFormData): Promise<Usuario> {
    return await apiClient.post<Usuario>(ENDPOINT, usuario);
  },

  async editar(id: string, usuario: UsuarioFormData): Promise<Usuario> {
    return await apiClient.put<Usuario>(`${ENDPOINT}/${id}`, usuario);
  },

  async eliminar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/eliminar`);
  },

  async restaurar(id: string): Promise<void> {
    await apiClient.patch(`${ENDPOINT}/${id}/restaurar`);
  },

  async exportarExcel(usuarios: Usuario[]) {
    await expExcel(ENDPOINT, 'Personal_AgroPacayales', usuarios, COLUMNAS_EXPORT);
  },

  async exportarPdf(usuarios: Usuario[]) {
    await expPdf(ENDPOINT, 'Personal_AgroPacayales', 'Nómina y Padrón Oficial de Personal', usuarios, COLUMNAS_EXPORT);
  },
};
