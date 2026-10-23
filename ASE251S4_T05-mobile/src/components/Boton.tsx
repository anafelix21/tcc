import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/colors';

type Variante = 'primario' | 'secundario' | 'tierra' | 'peligro' | 'contorno';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: string;
  compacto?: boolean;
  style?: ViewStyle;
};

const ESTILOS: Record<Variante, { fondo: string; texto: string; borde?: string }> = {
  primario: { fondo: colors.primary, texto: colors.white },
  secundario: { fondo: colors.primarySoft, texto: colors.primaryDark },
  tierra: { fondo: colors.brownSoft, texto: '#6D4C2F' },
  peligro: { fondo: colors.dangerSoft, texto: colors.danger },
  contorno: { fondo: colors.white, texto: colors.primary, borde: colors.border },
};

export function Boton({ titulo, onPress, variante = 'primario', cargando, deshabilitado, icono, compacto, style }: Props) {
  const e = ESTILOS[variante];
  const inactivo = deshabilitado || cargando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      disabled={inactivo}
      style={({ pressed }) => [
        styles.boton,
        compacto && styles.compacto,
        { backgroundColor: e.fondo, borderColor: e.borde ?? e.fondo, opacity: inactivo ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={e.texto} />
      ) : (
        <Text style={[styles.texto, compacto && { fontSize: 13 }, { color: e.texto }]}>{icono ? `${icono}  ${titulo}` : titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boton: { minHeight: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1 },
  compacto: { minHeight: 40, paddingHorizontal: 12, borderRadius: radius.sm },
  texto: { fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
});
