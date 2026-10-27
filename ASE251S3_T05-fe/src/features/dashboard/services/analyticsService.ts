import { apiClient } from '../../../services/apiClient';

export interface DashboardGeneralResponse {
  cards: {
    kilos_cosechados: number;
    eficiencia_cosecha_pct: number;
    valor_inventario: number;
    insumos_stock_critico: number;
    tasa_cumplimiento_actividades_pct: number;
    costo_total_mano_obra: number;
    usuarios_activos: number;
  };
  grafico_circular: Array<{ categoria: string; monto: number }>;
  grafico_barras: Array<{
    cultivo: string;
    kilos_optimos: number;
    kilos_merma: number;
    tasa_merma_pct: number;
  }>;
  tabla: Array<{
    id_insumo: string;
    nombre: string;
    cantidad_consumida: number;
    gasto_total: number;
    stock_actual: number;
  }>;
}

export interface HugoCampoResponse {
  actividades: {
    total_actividades: number;
    completadas: number;
    pendientes: number;
    tasa_cumplimiento_pct: number;
    costo_total_acumulado: number;
  };
  actividades_por_tipo: Array<{
    tipo_actividad: string;
    costo_total: number;
    cantidad: number;
  }>;
  insumos: {
    total_insumos: number;
    stock_total_unidades: number;
    valor_total_inventario: number;
    insumos_stock_critico: number;
  };
  insumos_por_tipo: Array<{
    tipo_insumo: string;
    items: number;
    stock: number;
    valor: number;
    porcentaje_valor: number;
  }>;
  stock_critico: Array<{
    id_insumo: string;
    nombre: string;
    stock: number;
    unidad_medida: string;
    tipo_insumo: string;
    proveedor: string;
  }>;
  consumo_top: Array<{
    id_insumo: string;
    nombre: string;
    cantidad_consumida: number;
    gasto_total: number;
    stock_actual: number;
  }>;
}

export interface AnaCosechasResponse {
  resumen: {
    total_cosechas: number;
    kilos_optimos: number;
    kilos_merma: number;
    kilos_totales: number;
    tasa_merma_pct: number;
    eficiencia_cosecha_pct: number;
  };
  calidad: Array<{
    categoria: string;
    kilos: number;
    porcentaje: number;
  }>;
  por_cultivo: Array<{
    cultivo: string;
    kilos_optimos: number;
    kilos_merma: number;
    kilos_totales?: number;
    tasa_merma_pct?: number;
  }>;
}

export interface AxelPersonalResponse {
  resumen: {
    total_usuarios: number;
    usuarios_activos: number;
    total_asignaciones: number;
    horas_totales_trabajadas: number;
    costo_total_mano_obra: number;
    costo_promedio_hora: number;
  };
  por_rol: Array<{
    rol: string;
    cantidad: number;
    porcentaje: number;
  }>;
  mano_obra_por_actividad: Array<{
    tipo_actividad: string;
    horas_trabajadas: number;
    costo_mano_obra: number;
  }>;
  ranking_trabajadores: Array<{
    id_usuario: string;
    nombre_completo: string;
    rol: string;
    asignaciones: number;
    costo_acumulado: number;
  }>;
}

export const analyticsService = {
  async obtenerGeneral(): Promise<DashboardGeneralResponse | null> {
    try {
      const res = await apiClient.getAnalytics<{ success: boolean; data: DashboardGeneralResponse }>('/dashboard/general');
      if (res && res.data && res.data.cards) {
        return res.data;
      }
    } catch (err) {
      console.warn('[Analytics Service] Error conectando con /dashboard/general:', err);
    }
    return null;
  },

  async obtenerHugoCampo(): Promise<HugoCampoResponse | null> {
    try {
      const [act, ins, actTipo, insTipo, crit, con] = await Promise.all([
        apiClient.getAnalytics<{ data: any }>('/campo/actividades/resumen').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/campo/insumos/resumen').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/campo/actividades/por-tipo').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/campo/insumos/por-tipo').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/campo/insumos/stock-critico').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/campo/insumos/consumo').catch(() => null),
      ]);

      if (act?.data || ins?.data) {
        return {
          actividades: act?.data || { total_actividades: 0, completadas: 0, pendientes: 0, tasa_cumplimiento_pct: 0, costo_total_acumulado: 0 },
          insumos: ins?.data || { total_insumos: 0, stock_total_unidades: 0, valor_total_inventario: 0, insumos_stock_critico: 0 },
          actividades_por_tipo: actTipo?.data || [],
          insumos_por_tipo: insTipo?.data || [],
          stock_critico: crit?.data || [],
          consumo_top: con?.data || [],
        };
      }
    } catch (err) {
      console.warn('[Analytics Service] Error conectando con /campo/*:', err);
    }
    return null;
  },

  async obtenerAnaCosechas(): Promise<AnaCosechasResponse | null> {
    try {
      const [res, cal, cul] = await Promise.all([
        apiClient.getAnalytics<{ data: any }>('/cosechas/resumen').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/cosechas/calidad').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/cosechas/por-cultivo').catch(() => null),
      ]);

      if (res?.data) {
        return {
          resumen: res.data,
          calidad: cal?.data || [],
          por_cultivo: cul?.data || [],
        };
      }
    } catch (err) {
      console.warn('[Analytics Service] Error conectando con /cosechas/*:', err);
    }
    return null;
  },

  async obtenerAxelPersonal(): Promise<AxelPersonalResponse | null> {
    try {
      const [res, rol, act, rank] = await Promise.all([
        apiClient.getAnalytics<{ data: any }>('/personal/resumen').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/personal/por-rol').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/personal/mano-obra-por-actividad').catch(() => null),
        apiClient.getAnalytics<{ data: any }>('/personal/ranking-trabajadores').catch(() => null),
      ]);

      if (res?.data) {
        return {
          resumen: res.data,
          por_rol: rol?.data || [],
          mano_obra_por_actividad: act?.data || [],
          ranking_trabajadores: rank?.data || [],
        };
      }
    } catch (err) {
      console.warn('[Analytics Service] Error conectando con /personal/*:', err);
    }
    return null;
  },
};

