import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from './apiClient';
import { Fuente, ModuloMaestro, ModuloTransaccion, Registro } from '../modules/types';

/** Servicio CRUD de los maestros (MongoDB) a través del Backend 1. */
export const maestroService = {
  listar: (m: ModuloMaestro, activos: boolean) => api<Registro[]>(`${m.endpoint}/estado/${activos}`),
  obtener: (m: ModuloMaestro, id: string) => api<Registro>(`${m.endpoint}/${id}`),
  registrar: (m: ModuloMaestro, data: Registro) => api<Registro>(m.endpoint, { method: 'POST', body: JSON.stringify(data) }),
  editar: (m: ModuloMaestro, id: string, data: Registro) =>
    api<Registro>(`${m.endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminar: (m: ModuloMaestro, id: string) => api<Registro>(`${m.endpoint}/${id}/eliminar`, { method: 'PATCH' }),
  restaurar: (m: ModuloMaestro, id: string) => api<Registro>(`${m.endpoint}/${id}/restaurar`, { method: 'PATCH' }),

  /** Abre el selector de archivos y sube un CSV o Excel a /importar/{csv|excel}. */
  async importar(m: ModuloMaestro): Promise<{ totalFilas: number; importados: number; fallidos: number; errores: string[] } | null> {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    });
    if (res.canceled) return null;
    const archivo = res.assets[0];
    const formato = archivo.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel';
    const form = new FormData();
    if (Platform.OS === 'web' && archivo.file) {
      form.append('file', archivo.file, archivo.name);
    } else {
      form.append('file', { uri: archivo.uri, name: archivo.name, type: archivo.mimeType ?? 'application/octet-stream' } as any);
    }
    return api(`${m.endpoint}/importar/${formato}`, { method: 'POST', body: form });
  },
};

/** Servicio de las transacciones cabecera-detalle (SQL Server) a través del Backend 1. */
export const transaccionService = {
  async listar(t: ModuloTransaccion, activos: boolean) {
    const ruta = t.listarPorEstado(activos);
    const data = await api<Registro[]>(ruta ?? t.endpoint);
    return ruta ? data : data.filter((r) => Boolean(r.estado) === activos);
  },
  obtener: (t: ModuloTransaccion, id: string) => api<Registro>(`${t.endpoint}/${id}`),
  registrar: (t: ModuloTransaccion, data: Registro) => api<Registro>(t.endpoint, { method: 'POST', body: JSON.stringify(data) }),
  editar: (t: ModuloTransaccion, id: string, data: Registro) =>
    api<Registro>(`${t.endpoint}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminar: (t: ModuloTransaccion, id: string) => {
    const r = t.rutaEliminar(id);
    return api<Registro>(r.path, { method: r.method });
  },
  restaurar: (t: ModuloTransaccion, id: string) => {
    const r = t.rutaRestaurar(id);
    return api<Registro>(r.path, { method: r.method });
  },
};

export type Opcion = { value: string; label: string; detalle?: string };

/** Catálogos para los selectores (cultivos de SQL Server; insumos y usuarios de MongoDB). */
export async function cargarCatalogo(fuente: Fuente): Promise<Opcion[]> {
  switch (fuente) {
    case 'cultivos':
      return (await api<Registro[]>('/cultivos')).map((c) => ({ value: String(c.idCultivo), label: c.nombre, detalle: c.tipoCultivo }));
    case 'insumos':
      return (await api<Registro[]>('/insumos/estado/true')).map((i) => ({
        value: i.id, label: i.nombre, detalle: `S/ ${Number(i.precio).toFixed(2)} · stock ${i.stock} ${i.unidadMedida}`,
      }));
    case 'usuarios':
      return (await api<Registro[]>('/usuarios/estado/true')).map((u) => ({
        value: u.id, label: `${u.nombre} ${u.apellido}`, detalle: u.rol,
      }));
    case 'actividades':
      return (await api<Registro[]>('/actividades-cultivos/estado/true')).map((a) => ({
        value: String(a.idActividad), label: `#${a.idActividad} ${a.tipoActividad}`, detalle: a.nombreCultivo,
      }));
  }
}
