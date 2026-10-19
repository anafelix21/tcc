import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

/**
 * Helper para obtener registros por estado con fallback automático.
 *
 * Intenta primero GET /endpoint/estado/{estado}.
 * Si el backend devuelve 404 (endpoint no implementado), hace fallback a
 * GET /endpoint y filtra por estado en el frontend.
 *
 * El primer intento es silencioso (no muestra notificación de error)
 * para que el usuario no vea un "Not Found" innecesario.
 */
export function obtenerPorEstadoConFallback<T extends { estado?: boolean }>(
  apiService: ApiService,
  endpoint: string,
  estado: boolean
): Observable<T[]> {
  // silent=true → no muestra toast de error si el endpoint /estado no existe
  return apiService.getBy<T>(endpoint, 'estado', estado, true).pipe(
    catchError(() =>
      apiService.getAll<T>(endpoint).pipe(
        map(items => items.filter(item => !!item.estado === !!estado)),
        catchError(() => of([]))
      )
    )
  );
}
