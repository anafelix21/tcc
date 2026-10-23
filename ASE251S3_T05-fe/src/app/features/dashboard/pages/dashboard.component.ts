import { Component, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../services/analytics.service';
import {
  DashboardGeneralResponse,
  CosechasSeccionResponse,
  CampoSeccionResponse,
  PersonalSeccionResponse,
  IndicadoresCatalogoResponse
} from '../models/analytics.model';

export type TabTipo = 'general' | 'cosechas' | 'campo' | 'personal' | 'catalogo';

interface DonutSlice {
  label: string;
  value: number;
  percentage: number;
  color: string;
  strokeDashoffset: number;
  strokeDasharray: string;
}

interface BarItem {
  label: string;
  value: number;
  heightPercent: number;
  formattedValue: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private cdr = inject(ChangeDetectorRef);

  activeTab: TabTipo = 'general';
  cargando = false;
  errorMensaje: string | null = null;
  statusOnline = false;

  // Datos de secciones
  datosGeneral: DashboardGeneralResponse['data'] | null = null;
  datosCosechas: CosechasSeccionResponse['data'] | null = null;
  datosCampo: CampoSeccionResponse['data'] | null = null;
  datosPersonal: PersonalSeccionResponse['data'] | null = null;
  catalogoIndicadores: IndicadoresCatalogoResponse['data'] | null = null;

  // Gráficos procesados
  donutSlices: DonutSlice[] = [];
  barItems: BarItem[] = [];

  readonly PALETTE = ['#2E7D32', '#B08D6A', '#15803D', '#D97706', '#0284C7', '#7C3AED', '#E11D48', '#059669'];

  ngOnInit(): void {
    this.cargarDatos(this.activeTab);
  }

  cambiarTab(tab: TabTipo): void {
    this.activeTab = tab;
    this.cargarDatos(tab);
  }

  cargarDatos(tab: TabTipo): void {
    this.cargando = true;
    this.errorMensaje = null;
    this.cdr.markForCheck();

    if (tab === 'general') {
      this.analyticsService.getDashboardGeneral().subscribe({
        next: (res) => {
          this.datosGeneral = res.data;
          this.statusOnline = true;
          this.prepararGraficosGeneral();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.manejarError(err)
      });
    } else if (tab === 'cosechas') {
      this.analyticsService.getCosechasSeccion().subscribe({
        next: (res) => {
          this.datosCosechas = res.data;
          this.statusOnline = true;
          this.prepararGraficosCosechas();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.manejarError(err)
      });
    } else if (tab === 'campo') {
      this.analyticsService.getCampoSeccion().subscribe({
        next: (res) => {
          this.datosCampo = res.data;
          this.statusOnline = true;
          this.prepararGraficosCampo();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.manejarError(err)
      });
    } else if (tab === 'personal') {
      this.analyticsService.getPersonalSeccion().subscribe({
        next: (res) => {
          this.datosPersonal = res.data;
          this.statusOnline = true;
          this.prepararGraficosPersonal();
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.manejarError(err)
      });
    } else if (tab === 'catalogo') {
      this.analyticsService.getIndicadores().subscribe({
        next: (res) => {
          this.catalogoIndicadores = res.data;
          this.statusOnline = true;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: (err) => this.manejarError(err)
      });
    }
  }

  private manejarError(err: any): void {
    this.cargando = false;
    this.statusOnline = false;
    this.errorMensaje = 'No se pudo conectar al Backend Analítico (Puerto 5000). Verifique que el servicio Flask esté corriendo.';
    this.cdr.markForCheck();
  }

  // --- CÁLCULO DE GRÁFICOS SVG ---
  private prepararGraficosGeneral(): void {
    if (!this.datosGeneral) return;

    // Gráfico circular: distribución de costos
    const circularData = this.datosGeneral.grafico_circular.map(x => ({ label: x.categoria, value: x.monto }));
    this.donutSlices = this.calcularDonutSlices(circularData);

    // Gráfico de barras: producción por cultivo
    const maxVal = Math.max(...this.datosGeneral.grafico_barras.map(x => x.kilos_totales), 1);
    this.barItems = this.datosGeneral.grafico_barras.map(x => ({
      label: x.cultivo,
      value: x.kilos_totales,
      heightPercent: Math.round((x.kilos_totales / maxVal) * 100),
      formattedValue: `${x.kilos_totales.toLocaleString('es-PE')} kg`
    }));
  }

  private prepararGraficosCosechas(): void {
    if (!this.datosCosechas) return;

    const circularData = this.datosCosechas.grafico_circular.map(x => ({ label: x.categoria, value: x.kilos }));
    this.donutSlices = this.calcularDonutSlices(circularData);

    const maxVal = Math.max(...this.datosCosechas.grafico_barras.map(x => x.kilos_totales), 1);
    this.barItems = this.datosCosechas.grafico_barras.map(x => ({
      label: x.cultivo,
      value: x.kilos_totales,
      heightPercent: Math.round((x.kilos_totales / maxVal) * 100),
      formattedValue: `${x.kilos_totales.toLocaleString('es-PE')} kg`
    }));
  }

  private prepararGraficosCampo(): void {
    if (!this.datosCampo) return;

    const circularData = this.datosCampo.grafico_circular.map(x => ({ label: x.tipo_insumo, value: x.valor_acumulado }));
    this.donutSlices = this.calcularDonutSlices(circularData);

    const maxVal = Math.max(...this.datosCampo.grafico_barras.map(x => x.costo_acumulado), 1);
    this.barItems = this.datosCampo.grafico_barras.map(x => ({
      label: x.tipo_actividad,
      value: x.costo_acumulado,
      heightPercent: Math.round((x.costo_acumulado / maxVal) * 100),
      formattedValue: `S/ ${x.costo_acumulado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
    }));
  }

  private prepararGraficosPersonal(): void {
    if (!this.datosPersonal) return;

    const circularData = this.datosPersonal.grafico_circular.map(x => ({ label: x.rol, value: x.total }));
    this.donutSlices = this.calcularDonutSlices(circularData);

    const maxVal = Math.max(...this.datosPersonal.grafico_barras.map(x => x.costo), 1);
    this.barItems = this.datosPersonal.grafico_barras.map(x => ({
      label: x.tipo_actividad,
      value: x.costo,
      heightPercent: Math.round((x.costo / maxVal) * 100),
      formattedValue: `S/ ${x.costo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
    }));
  }

  private calcularDonutSlices(items: Array<{ label: string; value: number }>): DonutSlice[] {
    const total = items.reduce((acc, curr) => acc + (curr.value || 0), 0);
    if (total === 0) return [];

    const circumference = 2 * Math.PI * 40; // radio = 40 (circunferencia aprox 251.32)
    let accumulatedAngle = 0;

    return items.map((item, index) => {
      const percentage = (item.value / total) * 100;
      const strokeLength = (percentage / 100) * circumference;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += strokeLength;

      return {
        label: item.label,
        value: item.value,
        percentage: Math.round(percentage * 10) / 10,
        color: this.PALETTE[index % this.PALETTE.length],
        strokeDashoffset,
        strokeDasharray: `${strokeLength} ${circumference - strokeLength}`
      };
    });
  }

  formatearSoles(valor: number | undefined): string {
    return 'S/ ' + (valor || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatearNumero(valor: number | undefined): string {
    return (valor || 0).toLocaleString('es-PE');
  }

  getCatalogoKeys(): string[] {
    return this.catalogoIndicadores ? Object.keys(this.catalogoIndicadores) : [];
  }
}
