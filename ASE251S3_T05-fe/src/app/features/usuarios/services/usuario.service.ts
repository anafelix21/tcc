import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { obtenerPorEstadoConFallback } from '../../../core/services/crud-base.service';
import { Usuario, UsuarioDTO } from '../../../core/models/usuario.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private apiService = inject(ApiService);
  private http = inject(HttpClient);
  private endpoint = '/usuarios';

  listarTodos(): Observable<Usuario[]> {
    return this.apiService.getAll<Usuario>(this.endpoint);
  }

  obtenerPorId(id: number): Observable<Usuario> {
    return this.apiService.getById<Usuario>(this.endpoint, id);
  }

  /** Usa /estado/{estado} con fallback automático a listarTodos + filtro local */
  obtenerPorEstado(estado: boolean): Observable<Usuario[]> {
    return obtenerPorEstadoConFallback<Usuario>(this.apiService, this.endpoint, estado);
  }

  crear(usuario: UsuarioDTO, silent = false): Observable<Usuario> {
    return this.apiService.create<Usuario>(this.endpoint, usuario, silent);
  }

  editar(id: number, usuario: UsuarioDTO, silent = false): Observable<Usuario> {
    return this.apiService.update<Usuario>(this.endpoint, id, usuario, silent);
  }

  eliminar(id: number): Observable<Usuario> {
    return this.apiService.patch<Usuario>(`${this.endpoint}/${id}/eliminar`);
  }

  restaurar(id: number): Observable<Usuario> {
    return this.apiService.patch<Usuario>(`${this.endpoint}/${id}/restaurar`);
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
