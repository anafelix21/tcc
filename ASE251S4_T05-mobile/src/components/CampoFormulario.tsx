import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Campo } from '../modules/types';
import { colors, radius } from '../theme/colors';
import { CampoTexto } from './CampoTexto';
import { SelectorChips } from './SelectorChips';
import { SelectorEntidad } from './SelectorEntidad';

type Props = {
  campo: Campo;
  valor: string;
  onChange: (valor: string) => void;
  error?: string;
  esEdicion?: boolean;
};

/** Dibuja el control adecuado según el tipo de campo definido en el módulo. */
export function CampoFormulario({ campo, valor, onChange, error, esEdicion }: Props) {
  const obligatorio = campo.requerido || (campo.requeridoAlCrear && !esEdicion);

  switch (campo.tipo) {
    case 'opciones':
      return <SelectorChips etiqueta={campo.label} opciones={campo.opciones ?? []} valor={valor} onChange={onChange} error={error} obligatorio={obligatorio} />;
    case 'seleccion':
      return <SelectorEntidad etiqueta={campo.label} fuente={campo.fuente!} valor={valor} onChange={onChange} error={error} obligatorio={obligatorio} />;
    case 'booleano':
      return (
        <Pressable accessibilityRole="switch" accessibilityState={{ checked: valor === 'true' }} onPress={() => onChange(valor === 'true' ? 'false' : 'true')} style={styles.switch}>
          <Text style={styles.switchTexto}>{campo.label}</Text>
          <Switch value={valor === 'true'} onValueChange={(v) => onChange(String(v))}
            trackColor={{ true: colors.primary, false: colors.brownLight }} thumbColor={colors.white} />
        </Pressable>
      );
    default:
      return (
        <CampoTexto
          etiqueta={campo.label}
          obligatorio={obligatorio}
          value={valor}
          onChangeText={onChange}
          error={error}
          placeholder={campo.placeholder}
          secureTextEntry={campo.tipo === 'password'}
          autoCapitalize={campo.tipo === 'email' || campo.tipo === 'password' ? 'none' : 'sentences'}
          keyboardType={campo.tipo === 'entero' ? 'number-pad' : campo.tipo === 'decimal' ? 'decimal-pad' : campo.tipo === 'email' ? 'email-address' : 'default'}
          multiline={campo.tipo === 'multilinea'}
          style={campo.tipo === 'multilinea' ? { minHeight: 84, textAlignVertical: 'top' } : undefined}
        />
      );
  }
}

const styles = StyleSheet.create({
  switch: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 14, marginBottom: 16 },
  switchTexto: { fontSize: 14, fontWeight: '700', color: colors.primaryDark },
});
