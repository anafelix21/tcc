import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MAESTROS } from '../../../modules/maestros';
import { maestroService } from '../../../services/crudService';
import { CampoFormulario } from '../../../components/CampoFormulario';
import { Cargando, MensajeError, Tarjeta } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { aPayload, aValores, validar, valoresVacios } from '../../../utils/formularios';
import { avisar } from '../../../utils/dialogs';

/** Formulario de registro (sin id) y edición (con id) para cualquier maestro. */
export default function MaestroFormularioScreen() {
  const { modulo, id } = useLocalSearchParams<{ modulo: string; id?: string }>();
  const m = MAESTROS[modulo];
  const esEdicion = Boolean(id);
  const [valores, setValores] = useState(() => valoresVacios(m.campos));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    maestroService.obtener(m, id)
      .then((r) => setValores(aValores(m.campos, r)))
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false));
  }, [m, id]);

  const cambiar = (key: string) => (v: string) => {
    setValores((prev) => ({ ...prev, [key]: v }));
    setErrores((prev) => ({ ...prev, [key]: '' }));
  };

  const guardar = async () => {
    const e = validar(m.campos, valores, esEdicion);
    setErrores(e);
    if (Object.keys(e).length) return;
    setGuardando(true);
    setErrorApi(null);
    try {
      const payload = aPayload(m.campos, valores);
      const r = esEdicion ? await maestroService.editar(m, id!, payload) : await maestroService.registrar(m, payload);
      avisar(esEdicion ? 'Cambios guardados' : 'Registro exitoso', `"${m.resumen(r).titulo}" se guardó correctamente.`);
      router.back();
    } catch (err) {
      setErrorApi((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Cargando />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `${esEdicion ? 'Editar' : 'Registrar'} ${m.singular}` }} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Tarjeta>
          {m.campos.map((c) => (
            <CampoFormulario key={c.key} campo={c} valor={valores[c.key] ?? ''} onChange={cambiar(c.key)} error={errores[c.key]} esEdicion={esEdicion} />
          ))}
        </Tarjeta>
        {errorApi ? <MensajeError mensaje={errorApi} /> : null}
        <View style={{ gap: 10 }}>
          <Boton titulo={esEdicion ? 'Guardar cambios' : 'Registrar'} icono="✓" onPress={guardar} cargando={guardando} />
          <Boton titulo="Cancelar" variante="tierra" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
});
