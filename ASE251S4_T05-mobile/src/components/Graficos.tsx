import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { chartColors, colors, radius, shadow } from '../theme/colors';

export type Dato = { etiqueta: string; valor: number };

export function Kpi({ etiqueta, valor, icono }: { etiqueta: string; valor: string; icono?: string }) {
  return (
    <View style={styles.kpi}>
      {icono ? <Text style={styles.kpiIcono}>{icono}</Text> : null}
      <Text style={styles.kpiEtiqueta} numberOfLines={2}>{etiqueta}</Text>
      <Text style={[styles.kpiValor, valor.length > 11 && { fontSize: 18 }]} numberOfLines={1} adjustsFontSizeToFit>{valor}</Text>
    </View>
  );
}

/** Barras horizontales: legibles en pantallas angostas y con etiquetas largas. */
export function GraficoBarras({ datos, formato }: { datos: Dato[]; formato: (n: number) => string }) {
  const max = Math.max(...datos.map((d) => d.valor), 1);
  if (!datos.length) return <Text style={styles.vacio}>Sin datos registrados</Text>;
  return (
    <View style={{ gap: 12 }}>
      {datos.map((d, i) => (
        <View key={d.etiqueta + i}>
          <View style={styles.barraCabecera}>
            <Text style={styles.barraEtiqueta} numberOfLines={1}>{d.etiqueta}</Text>
            <Text style={styles.barraValor}>{formato(d.valor)}</Text>
          </View>
          <View style={styles.pista}>
            <View style={[styles.barra, { width: `${Math.max((d.valor / max) * 100, 2)}%`, backgroundColor: i === 0 ? colors.primary : '#66A86A' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Gráfico circular (dona) con leyenda y porcentajes. */
export function GraficoDona({ datos, centro }: { datos: Dato[]; centro?: string }) {
  const total = datos.reduce((s, d) => s + d.valor, 0);
  if (!total) return <Text style={styles.vacio}>Sin datos registrados</Text>;
  const r = 60;
  const c = 2 * Math.PI * r;
  let acumulado = 0;
  return (
    <View style={styles.donaFila}>
      <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
        {/* Se rota el lienzo para que el primer segmento empiece arriba (funciona en móvil y web) */}
        <Svg width={150} height={150} viewBox="0 0 150 150" style={{ transform: [{ rotate: '-90deg' }] }}>
            {datos.map((d, i) => {
              const largo = (d.valor / total) * c;
              const seg = (
                <Circle key={i} cx={75} cy={75} r={r} stroke={chartColors[i % chartColors.length]} strokeWidth={22} fill="none"
                  strokeDasharray={`${Math.max(largo - 2, 0)} ${c}`} strokeDashoffset={-acumulado} />
              );
              acumulado += largo;
              return seg;
            })}
        </Svg>
        {centro ? <Text style={styles.donaCentro}>{centro}</Text> : null}
      </View>
      <View style={{ flex: 1, gap: 8, minWidth: 140 }}>
        {datos.map((d, i) => (
          <View key={d.etiqueta + i} style={styles.leyenda}>
            <View style={[styles.punto, { backgroundColor: chartColors[i % chartColors.length] }]} />
            <Text style={styles.leyendaTexto} numberOfLines={1}>{d.etiqueta}</Text>
            <Text style={styles.leyendaPct}>{((d.valor / total) * 100).toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function Tabla({ columnas, filas }: { columnas: string[]; filas: (string | number)[][] }) {
  if (!filas.length) return <Text style={styles.vacio}>Sin datos registrados</Text>;
  return (
    <View>
      <View style={[styles.tablaFila, styles.tablaCabecera]}>
        {columnas.map((c, i) => <Text key={c} style={[styles.celda, styles.celdaCabecera, i > 0 && styles.celdaDerecha]}>{c}</Text>)}
      </View>
      {filas.map((f, i) => (
        <View key={i} style={[styles.tablaFila, i % 2 === 1 && { backgroundColor: colors.background }]}>
          {f.map((v, j) => <Text key={j} style={[styles.celda, j > 0 && styles.celdaDerecha]} numberOfLines={2}>{String(v ?? '—')}</Text>)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  kpi: { flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow },
  kpiIcono: { fontSize: 20, marginBottom: 6 },
  kpiEtiqueta: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  kpiValor: { fontSize: 22, fontWeight: '800', color: colors.primaryDark, marginTop: 4, fontVariant: ['tabular-nums'] },
  barraCabecera: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, gap: 8 },
  barraEtiqueta: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  barraValor: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  pista: { height: 12, backgroundColor: colors.brownSoft, borderRadius: 6, overflow: 'hidden' },
  barra: { height: 12, borderRadius: 6 },
  donaFila: { flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  donaCentro: { position: 'absolute', fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  leyendaTexto: { flex: 1, fontSize: 13, color: colors.text },
  leyendaPct: { fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  tablaFila: { flexDirection: 'row', paddingVertical: 9, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  tablaCabecera: { backgroundColor: colors.primarySoft, borderRadius: radius.sm, borderBottomWidth: 0 },
  celda: { flex: 1, fontSize: 12, color: colors.text, fontVariant: ['tabular-nums'] },
  celdaCabecera: { fontWeight: '800', color: colors.primaryDark },
  celdaDerecha: { textAlign: 'right' },
  vacio: { color: colors.muted, textAlign: 'center', paddingVertical: 16 },
});
