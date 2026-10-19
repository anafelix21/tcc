import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  protected baseUrl = environment.apiUrl;

  readonly loading = signal(false);

  getAll<T>(endpoint: string): Observable<T[]> {
    this.loading.set(true);
    return this.http.get<T[]>(`${this.baseUrl}${endpoint}`).pipe(
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error))
    );
  }

  getById<T>(endpoint: string, id: number | string): Observable<T> {
    this.loading.set(true);
    return this.http.get<T>(`${this.baseUrl}${endpoint}/${id}`).pipe(
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * GET con parámetro dinámico. silent=true suprime la notificación de error
   * (útil cuando se usa con fallback automático).
   */
  getBy<T>(endpoint: string, param: string, value: any, silent = false): Observable<T[]> {
    this.loading.set(true);
    return this.http.get<T[]>(`${this.baseUrl}${endpoint}/${param}/${value}`).pipe(
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error, silent))
    );
  }

  create<T>(endpoint: string, data: any, silent = false): Observable<T> {
    this.loading.set(true);
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data).pipe(
      tap(() => this.notificationService.show({ type: 'success', message: 'Registro creado exitosamente' })),
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error, silent))
    );
  }

  update<T>(endpoint: string, id: number | string, data: any, silent = false): Observable<T> {
    this.loading.set(true);
    return this.http.put<T>(`${this.baseUrl}${endpoint}/${id}`, data).pipe(
      tap(() => this.notificationService.show({ type: 'success', message: 'Registro actualizado exitosamente' })),
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error, silent))
    );
  }

  patch<T>(endpoint: string): Observable<T> {
    this.loading.set(true);
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, {}).pipe(
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error))
    );
  }

  delete<T>(endpoint: string, id: number | string): Observable<T> {
    this.loading.set(true);
    return this.http.delete<T>(`${this.baseUrl}${endpoint}/${id}`).pipe(
      tap(() => this.notificationService.show({ type: 'success', message: 'Registro eliminado exitosamente' })),
      finalize(() => this.loading.set(false)),
      catchError(error => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse, silent = false) {
    const errorMessage = error.error?.message
      || error.error?.error
      || `Error ${error.status}: ${error.statusText}`;

    console.error('API Error:', { status: error.status, message: errorMessage, url: error.url });

    // No mostrar notificación si es silencioso (usado en fallbacks)
    if (!silent) {
      this.notificationService.show({ type: 'error', message: errorMessage, duration: 5000 });
    }

    return throwError(() => ({ status: error.status, message: errorMessage }));
  }
}
