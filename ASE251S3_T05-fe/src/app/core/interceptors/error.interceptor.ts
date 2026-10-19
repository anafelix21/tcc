import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Interceptor global para manejo de errores HTTP
 * Centraliza el tratamiento de respuestas de error
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Log de error para debugging
        console.error('HTTP Error:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          timestamp: new Date().toISOString()
        });

        // Puedes agregar lógica adicional aquí
        // Por ejemplo, logout si es 401, refresh token en 403, etc.

        return throwError(() => error);
      })
    );
  }
}
