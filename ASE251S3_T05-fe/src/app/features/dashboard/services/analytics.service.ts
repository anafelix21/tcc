import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DashboardGeneralResponse,
  CosechasSeccionResponse,
  CampoSeccionResponse,
  PersonalSeccionResponse,
  IndicadoresCatalogoResponse,
  PresupuestoInsumosCategoriaResponse,
  PresupuestoParcelasCultivoResponse,
  PresupuestoStockCriticoResponse
} from '../models/analytics.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);
  private baseUrl = environment.analyticsApiUrl;

  getDashboardGeneral(): Observable<DashboardGeneralResponse> {
    return this.http.get<DashboardGeneralResponse>(`${this.baseUrl}/dashboard/general`);
  }

  getCosechasSeccion(): Observable<CosechasSeccionResponse> {
    return this.http.get<CosechasSeccionResponse>(`${this.baseUrl}/cosechas/seccion`);
  }

  getCampoSeccion(): Observable<CampoSeccionResponse> {
    return this.http.get<CampoSeccionResponse>(`${this.baseUrl}/campo/seccion`);
  }

  getPersonalSeccion(): Observable<PersonalSeccionResponse> {
    return this.http.get<PersonalSeccionResponse>(`${this.baseUrl}/personal/seccion`);
  }

  getIndicadores(): Observable<IndicadoresCatalogoResponse> {
    return this.http.get<IndicadoresCatalogoResponse>(`${this.baseUrl}/indicadores`);
  }

  // Servicios PIT Valle Grande (1 por integrante)
  getPresupuestoInsumosCategoria(): Observable<PresupuestoInsumosCategoriaResponse> {
    return this.http.get<PresupuestoInsumosCategoriaResponse>(`${this.baseUrl}/presupuesto/insumos-categoria`);
  }

  getPresupuestoParcelasCultivo(): Observable<PresupuestoParcelasCultivoResponse> {
    return this.http.get<PresupuestoParcelasCultivoResponse>(`${this.baseUrl}/presupuesto/parcelas-cultivo`);
  }

  getPresupuestoStockCritico(): Observable<PresupuestoStockCriticoResponse> {
    return this.http.get<PresupuestoStockCriticoResponse>(`${this.baseUrl}/presupuesto/stock-critico`);
  }
}
