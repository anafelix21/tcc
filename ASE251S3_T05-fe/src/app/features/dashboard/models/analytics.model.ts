export interface DashboardGeneralResponse {
  success: boolean;
  message: string;
  data: {
    cards: {
      kilos_cosechados: number;
      eficiencia_cosecha_pct: number;
      valor_inventario: number;
      tasa_cumplimiento_actividades_pct: number;
      costo_total_mano_obra: number;
      usuarios_activos: number;
    };
    grafico_barras: Array<{
      cultivo: string;
      kilos_totales: number;
    }>;
    grafico_circular: Array<{
      categoria: string;
      monto: number;
    }>;
    tabla: Array<{
      nombre: string;
      tipo_insumo: string;
      cantidad_consumida: number;
      gasto_total: number;
      indice_rotacion_pct: number;
    }>;
  };
}

export interface CosechasSeccionResponse {
  success: boolean;
  message: string;
  data: {
    cards: {
      total_cosechas: number;
      kilos_optimos: number;
      kilos_merma: number;
      eficiencia_cosecha_pct: number;
    };
    grafico_barras: Array<{
      cultivo: string;
      kilos_totales: number;
    }>;
    grafico_circular: Array<{
      categoria: string;
      kilos: number;
    }>;
    tabla: Array<{
      responsable: string;
      total_cosechas: number;
      kilos_totales: number;
      tasa_merma_pct: number;
    }>;
  };
}

export interface CampoSeccionResponse {
  success: boolean;
  message: string;
  data: {
    cards: {
      total_actividades: number;
      tasa_cumplimiento_pct: number;
      costo_total_acumulado: number;
      total_insumos: number;
      valor_total_inventario: number;
      insumos_stock_critico: number;
    };
    grafico_barras: Array<{
      tipo_actividad: string;
      costo_acumulado: number;
    }>;
    grafico_circular: Array<{
      tipo_insumo: string;
      valor_acumulado: number;
    }>;
    tabla: Array<{
      nombre: string;
      tipo_insumo: string;
      stock: number;
      unidad_medida: string;
      proveedor: string;
    }>;
  };
}

export interface PersonalSeccionResponse {
  success: boolean;
  message: string;
  data: {
    cards: {
      usuarios_activos: number;
      total_asignaciones: number;
      horas_trabajadas_totales: number;
      costo_total_mano_obra: number;
      costo_promedio_hora: number;
    };
    grafico_barras: Array<{
      tipo_actividad: string;
      costo: number;
    }>;
    grafico_circular: Array<{
      rol: string;
      total: number;
    }>;
    tabla: Array<{
      trabajador: string;
      rol: string;
      asignaciones: number;
      costo_mano_obra: number;
    }>;
  };
}

export interface IndicadorItem {
  codigo: string;
  endpoint: string;
  visual: string;
}

export interface IndicadoresCatalogoResponse {
  success: boolean;
  message: string;
  data: {
    [estudiante: string]: IndicadorItem[];
  };
}
