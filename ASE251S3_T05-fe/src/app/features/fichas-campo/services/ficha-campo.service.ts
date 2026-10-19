import { Injectable, inject } from '@angular/core';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { FichaCampo, FichaCampoDTO } from '../../../core/models/ficha-campo.model';

@Injectable({ providedIn: 'root' })
export class FichaCampoService {
  private apiService = inject(ApiService);
  private endpoint = '/fichas-campo';
  private cache$ = new BehaviorSubject<FichaCampo[] | null>(null);

  private clearCache(): void {
    this.cache$.next(null);
  }

  listarTodos(): Observable<FichaCampo[]> {
    if (this.cache$.value) {
      return of(this.cache$.value);
    }
    return this.apiService.getAll<FichaCampo>(this.endpoint).pipe(
      tap(data => this.cache$.next(data))
    );
  }

  obtenerPorId(id: number): Observable<FichaCampo> {
    return this.apiService.getById<FichaCampo>(this.endpoint, id);
  }

  obtenerPorEstado(estado: boolean): Observable<FichaCampo[]> {
    return obtenerPorEstadoConFallback<FichaCampo>(this.apiService, this.endpoint, estado);
  }

  crear(dto: FichaCampoDTO): Observable<FichaCampo> {
    return this.apiService.create<FichaCampo>(this.endpoint, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  editar(id: number, dto: FichaCampoDTO): Observable<FichaCampo> {
    return this.apiService.update<FichaCampo>(this.endpoint, id, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  eliminar(id: number): Observable<FichaCampo> {
    return this.apiService.patch<FichaCampo>(`${this.endpoint}/${id}/eliminar`).pipe(
      tap(() => this.clearCache())
    );
  }

  restaurar(id: number): Observable<FichaCampo> {
    return this.apiService.patch<FichaCampo>(`${this.endpoint}/${id}/restaurar`).pipe(
      tap(() => this.clearCache())
    );
  }
}
