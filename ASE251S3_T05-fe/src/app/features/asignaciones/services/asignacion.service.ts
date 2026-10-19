import { Injectable, inject } from '@angular/core';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { AsignacionTrabajadores, AsignacionTrabajadoresDTO } from '../../../core/models/asignacion.model';

@Injectable({ providedIn: 'root' })
export class AsignacionTrabajadoresService {
  private apiService = inject(ApiService);
  private endpoint = '/asignaciones-trabajadores';
  private cache$ = new BehaviorSubject<AsignacionTrabajadores[] | null>(null);

  private clearCache(): void {
    this.cache$.next(null);
  }

  listarTodas(): Observable<AsignacionTrabajadores[]> {
    if (this.cache$.value) {
      return of(this.cache$.value);
    }
    return this.apiService.getAll<AsignacionTrabajadores>(this.endpoint).pipe(
      tap(data => this.cache$.next(data))
    );
  }

  obtenerPorId(id: number): Observable<AsignacionTrabajadores> {
    return this.apiService.getById<AsignacionTrabajadores>(this.endpoint, id);
  }

  obtenerPorEstado(estado: boolean): Observable<AsignacionTrabajadores[]> {
    return obtenerPorEstadoConFallback<AsignacionTrabajadores>(this.apiService, this.endpoint, estado);
  }

  crear(dto: AsignacionTrabajadoresDTO): Observable<AsignacionTrabajadores> {
    return this.apiService.create<AsignacionTrabajadores>(this.endpoint, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  eliminar(id: number): Observable<AsignacionTrabajadores> {
    return this.apiService.patch<AsignacionTrabajadores>(`${this.endpoint}/${id}/eliminar`).pipe(
      tap(() => this.clearCache())
    );
  }

  restaurar(id: number): Observable<AsignacionTrabajadores> {
    return this.apiService.patch<AsignacionTrabajadores>(`${this.endpoint}/${id}/restaurar`).pipe(
      tap(() => this.clearCache())
    );
  }

  obtenerPorActividad(idActividad: number): Observable<AsignacionTrabajadores[]> {
    return this.apiService.getAll<AsignacionTrabajadores>(`${this.endpoint}/actividad/${idActividad}`);
  }
}
