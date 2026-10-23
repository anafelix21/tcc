import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiAnalitico } from '../services/apiClient';
import { useCarga } from '../hooks/useCarga';
import { Cargando, MensajeError, Tarjeta, Titulo } from '../components/ui';
import { GraficoBarras, GraficoDona, Kpi, Tabla } from '../components/Graficos';
import { colors, radius } from '../theme/colors';
import { kilos, numero, porcentaje, soles } from '../utils/formato';

type Vista = 'general' | 'cosechas' | 'campo' | 'personal';

const VISTAS: { clave: Vista; titulo: string; ruta: string }[] = [
  { clave: 'general', titulo: 'General', ruta: '/dashboard/general' },
  { clave: 'cosechas', titulo: 'Ana · Cosechas', ruta: '/cosechas/seccion' },
  { clave: 'campo', titulo: 'Hugo · Campo', ruta: '/campo/seccion' },
  { clave: 'personal', titulo: 'Axel · Personal', ruta: '/personal/seccion' },
];

/** Traduce la respuesta de cada sección del Backend 2 a cards, barras, dona y tabla. */
function armar(vista: Vista, d: any) {
  switch (vista) {
    case 'general':
      return {
        kpis: [['🌾', 'Kilos cosechados', kilos(d.cards.kilos_cosechados)], ['✅', 'Eficiencia de cosecha', porcentaje(d.cards.eficiencia_cosecha_pct)],
          ['📦', 'Valor de inventario', soles(d.cards.valor_inventario)], ['🚜', 'Cumplimiento actividades', porcentaje(d.cards.tasa_cumplimiento_actividades_pct)],
          ['💰', 'Costo mano de obra', soles(d.cards.costo_total_mano_obra)], ['👥', 'Usuarios activos', numero(d.cards.usuarios_activos, 0)]],
        barras: { titulo: 'Producción por cultivo', datos: d.grafico_barras.map((x: any) => ({ etiqueta: x.cultivo, valor: x.kilos_totales })), formato: kilos },
        dona: { titulo: 'Distribución de costos operativos', datos: d.grafico_circular.map((x: any) => ({ etiqueta: x.categoria, valor: x.monto })) },
        tabla: { titulo: 'Top 5 insumos más consumidos', columnas: ['Insumo', 'Cantidad', 'Gasto'],
          filas: d.tabla.map((x: any) => [x.nombre, numero(x.cantidad_consumida), soles(x.gasto_total)]) },
      };
    case 'cosechas':
      return {
        kpis: [['🧺', 'Total cosechas', numero(d.cards.total_cosechas, 0)], ['🌾', 'Kilos óptimos', kilos(d.cards.kilos_optimos)],
          ['🍂', 'Kilos merma', kilos(d.cards.kilos_merma)], ['✅', 'Eficiencia', porcentaje(d.cards.eficiencia_cosecha_pct)]],
        barras: { titulo: 'Kilos por cultivo', datos: d.grafico_barras.map((x: any) => ({ etiqueta: x.cultivo, valor: x.kilos_totales })), formato: kilos },
        dona: { titulo: 'Calidad: óptimo vs merma', datos: d.grafico_circular.map((x: any) => ({ etiqueta: x.categoria, valor: x.kilos })) },
        tabla: { titulo: 'Desempeño por responsable', columnas: ['Responsable', 'Cosechas', 'Kilos', 'Merma'],
          filas: d.tabla.map((x: any) => [x.responsable, x.total_cosechas, numero(x.kilos_totales), porcentaje(x.tasa_merma_pct)]) },
      };
    case 'campo':
      return {
        kpis: [['🚜', 'Actividades', numero(d.cards.total_actividades, 0)], ['✅', 'Cumplimiento', porcentaje(d.cards.tasa_cumplimiento_pct)],
          ['💵', 'Costo actividades', soles(d.cards.costo_total_acumulado)], ['🧪', 'Insumos activos', numero(d.cards.total_insumos, 0)],
          ['📦', 'Valor inventario', soles(d.cards.valor_total_inventario)], ['⚠️', 'Stock crítico', numero(d.cards.insumos_stock_critico, 0)]],
        barras: { titulo: 'Costo por tipo de actividad', datos: d.grafico_barras.map((x: any) => ({ etiqueta: x.tipo_actividad, valor: x.costo_acumulado })), formato: soles },
        dona: { titulo: 'Valor de inventario por tipo', datos: d.grafico_circular.map((x: any) => ({ etiqueta: x.tipo_insumo, valor: x.valor_acumulado })) },
        tabla: { titulo: 'Insumos con stock crítico (≤ 20)', columnas: ['Insumo', 'Stock', 'Unidad'],
          filas: d.tabla.map((x: any) => [x.nombre, x.stock, x.unidad_medida]) },
      };
    case 'personal':
      return {
        kpis: [['👥', 'Usuarios activos', numero(d.cards.usuarios_activos, 0)], ['📋', 'Asignaciones', numero(d.cards.total_asignaciones, 0)],
          ['⏱', 'Horas trabajadas', numero(d.cards.horas_trabajadas_totales)], ['💰', 'Costo mano de obra', soles(d.cards.costo_total_mano_obra)]],
        barras: { titulo: 'Costo de mano de obra por actividad', datos: d.grafico_barras.map((x: any) => ({ etiqueta: x.tipo_actividad, valor: x.costo })), formato: soles },
        dona: { titulo: 'Personal activo por rol', datos: d.grafico_circular.map((x: any) => ({ etiqueta: x.rol, valor: x.total })) },
        tabla: { titulo: 'Ranking de trabajadores', columnas: ['Trabajador', 'Asig.', 'Costo'],
          filas: d.tabla.map((x: any) => [x.trabajador, x.asignaciones, soles(x.costo_mano_obra)]) },
      };
  }
}

export default function DashboardScreen() {
  const [vista, setVista] = useState<Vista>('general');
  const ruta = VISTAS.find((v) => v.clave === vista)!.ruta;
  const { datos, cargando, error, recargar } = useCarga(() => apiAnalitico<any>(ruta), [ruta]);
  const panel = datos ? armar(vista, datos) : null;

  return (
    <ScrollView contentContainerStyle={styles.contenido}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {VISTAS.map((v) => (
          <Pressable key={v.clave} accessibilityRole="tab" accessibilityState={{ selected: vista === v.clave }}
            onPress={() => setVista(v.clave)} style={[styles.tab, vista === v.clave && styles.tabActiva]}>
            <Text style={[styles.tabTexto, vista === v.clave && { color: colors.white }]}>{v.titulo}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {error ? <MensajeError mensaje={`No se pudo consultar el Backend Analítico: ${error}`} /> : null}
      {!panel ? (cargando ? <Cargando /> : null) : (
        <>
          <View style={styles.kpis}>
            {panel.kpis.map(([icono, etiqueta, valor]) => <Kpi key={etiqueta} icono={icono} etiqueta={etiqueta} valor={valor} />)}
          </View>
          <Tarjeta>
            <Titulo>{panel.barras.titulo}</Titulo>
            <GraficoBarras datos={panel.barras.datos} formato={panel.barras.formato} />
          </Tarjeta>
          <Tarjeta>
            <Titulo>{panel.dona.titulo}</Titulo>
            <GraficoDona datos={panel.dona.datos} />
          </Tarjeta>
          <Tarjeta>
            <Titulo>{panel.tabla.titulo}</Titulo>
            <Tabla columnas={panel.tabla.columnas} filas={panel.tabla.filas} />
          </Tarjeta>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.brownSoft },
  tabActiva: { backgroundColor: colors.primary },
  tabTexto: { fontWeight: '700', color: '#6D4C2F' },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
