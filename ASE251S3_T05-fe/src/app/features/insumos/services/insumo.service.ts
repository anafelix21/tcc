import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { Insumo, InsumoDTO } from '../../../core/models/insumo.model';
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

  obtenerPorId(id: number): Observable<Insumo> {
    return this.apiService.getById<Insumo>(this.endpoint, id);
  }

  /** Usa /estado/{estado} con fallback automático a listarTodos + filtro local */
  obtenerPorEstado(estado: boolean): Observable<Insumo[]> {
    return obtenerPorEstadoConFallback<Insumo>(this.apiService, this.endpoint, estado);
  }

  crear(insumo: InsumoDTO, silent = false): Observable<Insumo> {
    return this.apiService.create<Insumo>(this.endpoint, insumo, silent);
  }

  editar(id: number, insumo: InsumoDTO, silent = false): Observable<Insumo> {
    return this.apiService.update<Insumo>(this.endpoint, id, insumo, silent);
  }

  eliminar(id: number): Observable<Insumo> {
    return this.apiService.patch<Insumo>(`${this.endpoint}/${id}/eliminar`);
  }

  restaurar(id: number): Observable<Insumo> {
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
    const url = estado ? `${this.baseUrl}${this.endpoint}/pdf?estado=${estado}` : `${this.baseUrl}${this.endpoint}/pdf`;
    return this.http.get(url, { responseType: 'blob' });
  }

  exportarExcel(estado?: string): Observable<Blob> {
    const url = estado ? `${this.baseUrl}${this.endpoint}/excel?estado=${estado}` : `${this.baseUrl}${this.endpoint}/excel`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
