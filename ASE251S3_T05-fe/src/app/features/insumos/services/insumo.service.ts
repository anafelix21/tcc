import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { Insumo, InsumoDTO, ImportResult } from '../../../core/models/insumo.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InsumoService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/insumos';

  listarTodos(): Observable<Insumo[]> {
    return this.apiService.getAll<Insumo>(this.endpoint);
  }

  obtenerPorId(id: string | number): Observable<Insumo> {
    return this.apiService.getById<Insumo>(this.endpoint, id as any);
  }

  /** Usa /estado/{estado} con fallback automático a listarTodos + filtro local */
  obtenerPorEstado(estado: boolean): Observable<Insumo[]> {
    return obtenerPorEstadoConFallback<Insumo>(this.apiService, this.endpoint, estado);
  }

  crear(insumo: InsumoDTO, silent = false): Observable<Insumo> {
    return this.apiService.create<Insumo>(this.endpoint, insumo, silent);
  }

  editar(id: string | number, insumo: InsumoDTO, silent = false): Observable<Insumo> {
    return this.apiService.update<Insumo>(this.endpoint, id as any, insumo, silent);
  }

  eliminar(id: string | number): Observable<Insumo> {
    return this.apiService.patch<Insumo>(`${this.endpoint}/${id}/eliminar`);
  }

  restaurar(id: string | number): Observable<Insumo> {
    return this.apiService.patch<Insumo>(`${this.endpoint}/${id}/restaurar`);
  }

  buscarPorNombre(nombre: string): Observable<Insumo[]> {
    return this.apiService.getAll<Insumo>(`${this.endpoint}/buscar?nombre=${nombre}`);
  }

  filtrarPorTipo(tipo: string): Observable<Insumo[]> {
    return this.apiService.getAll<Insumo>(`${this.endpoint}/filtrar?tipo=${tipo}`);
  }

  listarPaginado(page: number, size: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}${this.endpoint}/paginado?page=${page}&size=${size}`);
  }

  exportarPdf(estado?: string): Observable<Blob> {
    // Si se especifica estado, primero intenta con parámetro o ruta directa
    const url = `${this.baseUrl}${this.endpoint}/exportar/pdf`;
    return this.http.get(url, { responseType: 'blob' });
  }

  exportarExcel(estado?: string): Observable<Blob> {
    const url = `${this.baseUrl}${this.endpoint}/exportar/excel`;
    return this.http.get(url, { responseType: 'blob' });
  }

  importarCsv(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.baseUrl}${this.endpoint}/importar/csv`, formData);
  }

  importarExcel(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.baseUrl}${this.endpoint}/importar/excel`, formData);
  }
}

