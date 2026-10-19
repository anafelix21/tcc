import { Injectable, inject } from '@angular/core';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { Cultivo, CultivoDTO } from '../../../core/models/cultivo.model';

@Injectable({ providedIn: 'root' })
export class CultivoService {
  private apiService = inject(ApiService);
  private endpoint = '/cultivos';
  private cultivosCache$ = new BehaviorSubject<Cultivo[] | null>(null);

  private clearCache(): void {
    this.cultivosCache$.next(null);
  }

  /**
   * Retrieves all crop cycles from the database.
   * @returns Observable array of Cultivo.
   */
  listarTodos(): Observable<Cultivo[]> {
    if (this.cultivosCache$.value) {
      return of(this.cultivosCache$.value);
    }
    return this.apiService.getAll<Cultivo>(this.endpoint).pipe(
      tap(cultivos => this.cultivosCache$.next(cultivos))
    );
  }

  /**
   * Retrieves a specific crop cycle by its ID.
   * @param id The unique identifier of the crop.
   * @returns Observable of Cultivo.
   */
  obtenerPorId(id: number): Observable<Cultivo> {
    return this.apiService.getById<Cultivo>(this.endpoint, id);
  }

  /** Usa /estado/{estado} con fallback automático a listarTodos + filtro local */
  obtenerPorEstado(estado: boolean): Observable<Cultivo[]> {
    return obtenerPorEstadoConFallback<Cultivo>(this.apiService, this.endpoint, estado);
  }

  crear(cultivo: CultivoDTO, silent = false): Observable<Cultivo> {
    return this.apiService.create<Cultivo>(this.endpoint, cultivo, silent).pipe(
      tap(created => {
        console.log('Crop created successfully:', created);
        this.clearCache();
      })
    );
  }

  editar(id: number, cultivo: CultivoDTO, silent = false): Observable<Cultivo> {
    return this.apiService.update<Cultivo>(this.endpoint, id, cultivo, silent).pipe(
      tap(updated => {
        console.log(`Crop with ID ${id} updated successfully:`, updated);
        this.clearCache();
      })
    );
  }

  eliminar(id: number): Observable<Cultivo> {
    return this.apiService.patch<Cultivo>(`${this.endpoint}/${id}/eliminar`).pipe(
      tap(() => {
        console.warn(`Crop logically deleted with ID: ${id}`);
        this.clearCache();
      })
    );
  }

  restaurar(id: number): Observable<Cultivo> {
    return this.apiService.patch<Cultivo>(`${this.endpoint}/${id}/restaurar`).pipe(
      tap(() => {
        console.log(`Crop restored with ID: ${id}`);
        this.clearCache();
      })
    );
  }

  /** Obtiene cultivos de una parcela específica */
  obtenerPorParcela(parcelaId: number): Observable<Cultivo[]> {
    return this.apiService.getAll<Cultivo>(`${this.endpoint}/parcela/${parcelaId}`);
  }

  /** Obtiene cultivos de una parcela filtrados por estado */
  obtenerPorParcelaYEstado(parcelaId: number, estado: boolean): Observable<Cultivo[]> {
    return this.apiService.getAll<Cultivo>(`${this.endpoint}/parcela/${parcelaId}/estado/${estado}`);
  }
}
