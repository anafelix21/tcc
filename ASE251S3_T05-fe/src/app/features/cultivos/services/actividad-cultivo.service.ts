import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ActividadCultivoService {
  private apiService = inject(ApiService);
  private endpoint = '/actividades-cultivos';

  listarTodas(): Observable<any[]> {
    return this.apiService.getAll<any>(this.endpoint);
  }

  obtenerPorId(id: number): Observable<any> {
    return this.apiService.getById<any>(this.endpoint, id);
  }

  obtenerPorEstado(estado: boolean): Observable<any[]> {
    return this.apiService.getAll<any>(`${this.endpoint}/estado/${estado}`);
  }

  registrar(actividad: any): Observable<any> {
    return this.apiService.create<any>(this.endpoint, actividad);
  }

  editar(id: number, actividad: any): Observable<any> {
    return this.apiService.update<any>(this.endpoint, id, actividad);
  }

  eliminar(id: number): Observable<any> {
    return this.apiService.patch<any>(`${this.endpoint}/${id}/eliminar`);
  }

  restaurar(id: number): Observable<any> {
    return this.apiService.patch<any>(`${this.endpoint}/${id}/restaurar`);
  }
}
