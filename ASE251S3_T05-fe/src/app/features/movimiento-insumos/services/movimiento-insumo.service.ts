import { Injectable, inject } from '@angular/core';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MovimientoInsumo, MovimientoInsumoDTO } from '../../../core/models/movimiento-insumo.model';

@Injectable({ providedIn: 'root' })
export class MovimientoInsumoService {
  private apiService = inject(ApiService);
  private endpoint = '/movimiento-insumos';
  private cache$ = new BehaviorSubject<MovimientoInsumo[] | null>(null);

  private clearCache(): void {
    this.cache$.next(null);
  }

  listarTodos(): Observable<MovimientoInsumo[]> {
    if (this.cache$.value) {
      return of(this.cache$.value);
    }
    return this.apiService.getAll<MovimientoInsumo>(this.endpoint).pipe(
      tap(data => this.cache$.next(data))
    );
  }

  obtenerPorId(id: number): Observable<MovimientoInsumo> {
    return this.apiService.getById<MovimientoInsumo>(this.endpoint, id);
  }

  crear(dto: MovimientoInsumoDTO): Observable<MovimientoInsumo> {
    return this.apiService.create<MovimientoInsumo>(this.endpoint, dto).pipe(
      tap(() => this.clearCache())
    );
  }

  obtenerPorInsumo(idInsumo: number): Observable<MovimientoInsumo[]> {
    return this.apiService.getAll<MovimientoInsumo>(`${this.endpoint}/insumo/${idInsumo}`);
  }
}
