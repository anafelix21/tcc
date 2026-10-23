import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../theme/colors';

type Props = TextInputProps & { etiqueta: string; error?: string; obligatorio?: boolean };

export function CampoTexto({ etiqueta, error, obligatorio, style, ...props }: Props) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={styles.contenedor}>
      <Text style={styles.etiqueta}>
        {etiqueta}
        {obligatorio ? <Text style={{ color: colors.brown }}> *</Text> : null}
      </Text>
      <TextInput
        accessibilityLabel={etiqueta}
        placeholderTextColor="#B3AA9C"
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        style={[styles.input, foco && styles.foco, error ? { borderColor: colors.danger } : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export const estilosCampo = StyleSheet.create({
  etiqueta: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
});

const styles = StyleSheet.create({
  contenedor: { marginBottom: 16 },
  etiqueta: estilosCampo.etiqueta,
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  foco: { borderColor: colors.primary, backgroundColor: '#FCFEFB' },
  error: estilosCampo.error,
});
