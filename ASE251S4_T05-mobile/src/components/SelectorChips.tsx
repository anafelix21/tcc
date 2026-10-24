import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { estilosCampo } from './CampoTexto';
import { Icono } from './Icono';

type Props = {
  etiqueta: string;
  opciones: readonly string[];
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  obligatorio?: boolean;
};

export function SelectorChips({ etiqueta, opciones, valor, onChange, error, obligatorio }: Props) {
  return (
    <View style={styles.contenedor}>
      <Text style={estilosCampo.etiqueta}>
        {etiqueta}
        {obligatorio ? <Text style={{ color: colors.brown }}> *</Text> : null}
      </Text>
      <View style={styles.fila}>
        {opciones.map((op) => {
          const activo = op === valor;
          return (
            <Pressable
              key={op}
              accessibilityRole="radio"
              accessibilityLabel={op}
              accessibilityState={{ selected: activo }}
              onPress={() => onChange(op)}
              style={[styles.chip, activo && styles.chipActivo]}
            >
              <View style={styles.chipInterior}>
                {activo ? <Icono name="checkmark" size={13} color={colors.white} /> : null}
                <Text style={[styles.texto, activo && styles.textoActivo]}>{op}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={estilosCampo.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { marginBottom: 16 },
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.brownSoft, borderWidth: 1, borderColor: colors.brownLight },
  chipActivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipInterior: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  texto: { fontSize: 13, color: '#6D4C2F', fontWeight: '600' },
  textoActivo: { color: colors.white },
});
