import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { Parcela, ParcelaDTO } from '../../../core/models/parcela.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParcelaService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private endpoint = '/parcelas';

  /**
   * Retrieves all plot/parcel information from the database.
   * @returns Observable array of Parcela.
   */
  listarTodos(): Observable<Parcela[]> {
    return this.apiService.getAll<Parcela>(this.endpoint);
  }

  /**
   * Retrieves a specific plot/parcel by its ID.
   * @param id The unique identifier of the plot.
   * @returns Observable of Parcela.
   */
  obtenerPorId(id: number): Observable<Parcela> {
    return this.apiService.getById<Parcela>(this.endpoint, id);
  }

  /** Usa /estado/{estado} con fallback automático a listarTodos + filtro local */
  obtenerPorEstado(estado: boolean): Observable<Parcela[]> {
    return obtenerPorEstadoConFallback<Parcela>(this.apiService, this.endpoint, estado);
  }

  crear(parcela: ParcelaDTO, silent = false): Observable<Parcela> {
    return this.apiService.create<Parcela>(this.endpoint, parcela, silent);
  }

  editar(id: number, parcela: ParcelaDTO, silent = false): Observable<Parcela> {
    return this.apiService.update<Parcela>(this.endpoint, id, parcela, silent);
  }

  eliminar(id: number): Observable<Parcela> {
    return this.apiService.patch<Parcela>(`${this.endpoint}/${id}/eliminar`);
  }

  restaurar(id: number): Observable<Parcela> {
    return this.apiService.patch<Parcela>(`${this.endpoint}/${id}/restaurar`);
  }

  exportarPdf(estado?: string): Observable<Blob> {
    const url = estado ? `${environment.apiUrl}${this.endpoint}/pdf?estado=${estado}` : `${environment.apiUrl}${this.endpoint}/pdf`;
    return this.http.get(url, { responseType: 'blob' });
  }

  exportarExcel(estado?: string): Observable<Blob> {
    const url = estado ? `${environment.apiUrl}${this.endpoint}/excel?estado=${estado}` : `${environment.apiUrl}${this.endpoint}/excel`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
