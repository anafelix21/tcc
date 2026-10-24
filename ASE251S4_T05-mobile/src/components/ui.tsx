import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { colors, radius, shadow } from '../theme/colors';
import { Resumen } from '../modules/types';
import { texto } from '../utils/formato';
import { Icono } from './Icono';

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.tarjeta, style]}>{children}</View>;
}

export function Insignia({ texto: t, tono = 'verde' }: { texto: string; tono?: 'verde' | 'tierra' | 'rojo' }) {
  const c = { verde: [colors.primarySoft, colors.primaryDark], tierra: [colors.brownSoft, '#6D4C2F'], rojo: [colors.dangerSoft, colors.danger] }[tono];
  return <Text style={[styles.insignia, { backgroundColor: c[0], color: c[1] }]}>{t}</Text>;
}

/** Ítem de lista reutilizado por maestros y transacciones. */
export function ItemLista({ resumen, onPress, inactivo }: { resumen: Resumen; onPress: () => void; inactivo?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={resumen.titulo} onPress={onPress}
      style={({ pressed }) => [styles.tarjeta, styles.item, pressed && { transform: [{ scale: 0.99 }], opacity: 0.92 }]}>
      <View style={[styles.franja, { backgroundColor: inactivo ? colors.brownLight : colors.primary }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.filaEntre}>
          <Text style={styles.itemTitulo} numberOfLines={1}>{resumen.titulo}</Text>
          {resumen.valor ? <Text style={styles.itemValor}>{resumen.valor}</Text> : null}
        </View>
        {resumen.subtitulo ? <Text style={styles.itemSub} numberOfLines={1}>{resumen.subtitulo}</Text> : null}
        <View style={[styles.filaEntre, { marginTop: 8 }]}>
          {resumen.insignia ? <Insignia texto={resumen.insignia} tono={inactivo ? 'tierra' : 'verde'} /> : <View />}
          {resumen.detalle ? <Text style={styles.itemDetalle}>{resumen.detalle}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

export function Pestanas({ activos, onChange }: { activos: boolean; onChange: (activos: boolean) => void }) {
  return (
    <View style={styles.pestanas}>
      {[true, false].map((a) => (
        <Pressable key={String(a)} accessibilityRole="tab" accessibilityState={{ selected: activos === a }}
          onPress={() => onChange(a)} style={[styles.pestana, activos === a && styles.pestanaActiva]}>
          <Text style={[styles.pestanaTexto, activos === a && { color: colors.primaryDark }]}>{a ? 'Activos' : 'Eliminados'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Buscador({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.buscador}>
      <Icono name="search-outline" size={18} color={colors.muted} />
      <TextInput accessibilityLabel="Buscar" style={styles.buscadorInput} placeholder="Buscar..." placeholderTextColor="#B3AA9C" value={valor} onChangeText={onChange} />
    </View>
  );
}

export function FilaDato({ etiqueta, valor }: { etiqueta: string; valor: unknown }) {
  return (
    <View style={styles.filaDato}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{texto(valor)}</Text>
    </View>
  );
}

export function Cargando() {
  return <ActivityIndicator style={{ marginTop: 48 }} size="large" color={colors.primary} />;
}

export function MensajeError({ mensaje }: { mensaje: string }) {
  return <Text style={styles.error}>{mensaje}</Text>;
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={styles.titulo}>{children}</Text>;
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow },
  item: { flexDirection: 'row', gap: 12, paddingLeft: 12 },
  franja: { width: 5, borderRadius: 4 },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemTitulo: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  itemValor: { fontSize: 15, fontWeight: '800', color: colors.primaryDark, fontVariant: ['tabular-nums'] },
  itemSub: { fontSize: 13, color: colors.muted, marginTop: 3 },
  itemDetalle: { fontSize: 12, color: colors.muted, fontVariant: ['tabular-nums'] },
  insignia: { fontSize: 11, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', letterSpacing: 0.3 },
  pestanas: { flexDirection: 'row', backgroundColor: colors.brownSoft, borderRadius: radius.md, padding: 4 },
  pestana: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.sm },
  pestanaActiva: { backgroundColor: colors.white, ...shadow, shadowOpacity: 0.05 },
  pestanaTexto: { color: colors.muted, fontWeight: '700' },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 },
  buscadorInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: colors.text },
  filaDato: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  datoEtiqueta: { color: colors.muted, fontSize: 13 },
  datoValor: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 12, borderRadius: radius.md, marginBottom: 12 },
  titulo: { fontSize: 16, fontWeight: '800', color: colors.primaryDark, marginBottom: 8 },
});
