import { Injectable, inject } from '@angular/core';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { ActividadCultivo, ActividadCultivoDTO } from '../../../core/models/actividad.model';

@Injectable({ providedIn: 'root' })
export class ActividadCultivoService {
  private apiService = inject(ApiService);
  private endpoint = '/actividades-cultivos';
  private cache$ = new BehaviorSubject<ActividadCultivo[] | null>(null);

  private clearCache(): void {
    this.cache$.next(null);
  }

  listarTodas(): Observable<ActividadCultivo[]> {
    if (this.cache$.value) {
      return of(this.cache$.value);
    }
    return this.apiService.getAll<ActividadCultivo>(this.endpoint).pipe(
      tap(data => this.cache$.next(data))
    );
  }

  obtenerPorId(id: number): Observable<ActividadCultivo> {
    return this.apiService.getById<ActividadCultivo>(this.endpoint, id);
  }

  obtenerPorEstado(estado: boolean): Observable<ActividadCultivo[]> {
    return obtenerPorEstadoConFallback<ActividadCultivo>(this.apiService, this.endpoint, estado);
  }

  crear(dto: ActividadCultivoDTO): Observable<ActividadCultivo> {
    return this.apiService.create<ActividadCultivo>(this.endpoint, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  eliminar(id: number): Observable<ActividadCultivo> {
    return this.apiService.patch<ActividadCultivo>(`${this.endpoint}/${id}/eliminar`).pipe(
      tap(() => this.clearCache())
    );
  }

  restaurar(id: number): Observable<ActividadCultivo> {
    return this.apiService.patch<ActividadCultivo>(`${this.endpoint}/${id}/restaurar`).pipe(
      tap(() => this.clearCache())
    );
  }

  obtenerPorUsuario(idUsuario: number, estado: boolean): Observable<ActividadCultivo[]> {
    return this.apiService.getAll<ActividadCultivo>(`${this.endpoint}/usuario/${idUsuario}?estado=${estado}`);
  }

  confirmarTerminacion(idActividad: number, idUsuario: number): Observable<ActividadCultivo> {
    return this.apiService.patch<ActividadCultivo>(`${this.endpoint}/${idActividad}/confirmar-terminacion?idUsuario=${idUsuario}`).pipe(
      tap(() => this.clearCache())
    );
  }
}
