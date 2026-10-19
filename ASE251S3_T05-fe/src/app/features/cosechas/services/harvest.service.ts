import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Harvest, HarvestDTO } from '../../../core/models/harvest.model';

@Injectable({ providedIn: 'root' })
export class HarvestService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/harvest`;

  listarTodas(): Observable<Harvest[]> {
    return this.http.get<Harvest[]>(`${this.baseUrl}/listar`);
  }

  obtenerPorId(id: number): Observable<Harvest> {
    return this.http.get<Harvest>(`${this.baseUrl}/buscar/${id}`);
  }

  crear(dto: HarvestDTO): Observable<Harvest> {
    return this.http.post<Harvest>(`${this.baseUrl}/registrar`, dto);
  }

  eliminar(id: number): Observable<any> {
    // Retorna string en backend, por tanto responseType: 'text' es necesario
    return this.http.put(`${this.baseUrl}/eliminar/${id}`, {}, { responseType: 'text' });
  }
}
