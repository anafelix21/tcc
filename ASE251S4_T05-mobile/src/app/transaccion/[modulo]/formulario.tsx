import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { TRANSACCIONES } from '../../../modules/transacciones';
import { transaccionService } from '../../../services/crudService';
import { FormValores } from '../../../modules/types';
import { CampoFormulario } from '../../../components/CampoFormulario';
import { Cargando, MensajeError, Tarjeta, Titulo } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors, radius } from '../../../theme/colors';
import { aPayload, validar, valoresVacios } from '../../../utils/formularios';
import { avisar } from '../../../utils/dialogs';

/** Registro / edición de una transacción cabecera-detalle. */
export default function TransaccionFormularioScreen() {
  const { modulo, id } = useLocalSearchParams<{ modulo: string; id?: string }>();
  const t = TRANSACCIONES[modulo];
  const esEdicion = Boolean(id);
  const [cabecera, setCabecera] = useState<FormValores>(() => valoresVacios(t.cabecera));
  const [detalles, setDetalles] = useState<FormValores[]>(() => [valoresVacios(t.detalle.campos)]);
  const [errCab, setErrCab] = useState<Record<string, string>>({});
  const [errDet, setErrDet] = useState<Record<string, string>[]>([]);
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    transaccionService.obtener(t, id)
      .then((r) => {
        const f = t.aFormulario(r);
        setCabecera(f.cabecera);
        setDetalles(f.detalles.length ? f.detalles : [valoresVacios(t.detalle.campos)]);
      })
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false));
  }, [t, id]);

  const cambiarDetalle = (i: number, key: string) => (v: string) => {
    setDetalles((prev) => prev.map((d, j) => (j === i ? { ...d, [key]: v } : d)));
    setErrDet((prev) => prev.map((e, j) => (j === i ? { ...e, [key]: '' } : e)));
  };

  const guardar = async () => {
    const eCab = validar(t.cabecera, cabecera, esEdicion);
    const eDet = detalles.map((d) => validar(t.detalle.campos, d, esEdicion));
    setErrCab(eCab);
    setErrDet(eDet);
    if (Object.keys(eCab).length || eDet.some((e) => Object.keys(e).length)) return;

    setGuardando(true);
    setErrorApi(null);
    try {
      const payload = { ...aPayload(t.cabecera, cabecera), detalles: detalles.map((d) => aPayload(t.detalle.campos, d)) };
      // Los ids de SQL Server son numéricos; los de MongoDB son texto
      for (const c of [...t.cabecera, ...t.detalle.campos]) {
        if (c.tipo === 'seleccion' && (c.fuente === 'cultivos' || c.fuente === 'actividades')) {
          if (c.key in payload) (payload as any)[c.key] = Number((payload as any)[c.key]);
          payload.detalles.forEach((d: any) => { if (c.key in d) d[c.key] = Number(d[c.key]); });
        }
      }
      const r = esEdicion ? await transaccionService.editar(t, id!, payload) : await transaccionService.registrar(t, payload);
      avisar(esEdicion ? 'Cambios guardados' : 'Registro exitoso', `"${t.resumen(r).titulo}" se guardó correctamente.`);
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
      <Stack.Screen options={{ title: `${esEdicion ? 'Editar' : 'Registrar'} ${t.singular}` }} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Tarjeta>
          <Titulo>Cabecera</Titulo>
          {t.cabecera.map((c) => (
            <CampoFormulario key={c.key} campo={c} valor={cabecera[c.key] ?? ''} error={errCab[c.key]} esEdicion={esEdicion}
              onChange={(v) => { setCabecera((p) => ({ ...p, [c.key]: v })); setErrCab((p) => ({ ...p, [c.key]: '' })); }} />
          ))}
        </Tarjeta>

        <Tarjeta>
          <Titulo>{t.detalle.titulo}</Titulo>
          {detalles.map((d, i) => (
            <View key={i} style={styles.filaDetalle}>
              <View style={styles.filaCabecera}>
                <Text style={styles.numero}>Ítem {i + 1}</Text>
                {detalles.length > 1 ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ítem ${i + 1}`}
                    onPress={() => { setDetalles((p) => p.filter((_, j) => j !== i)); setErrDet((p) => p.filter((_, j) => j !== i)); }}>
                    <Text style={styles.quitar}>Quitar</Text>
                  </Pressable>
                ) : null}
              </View>
              {t.detalle.campos.map((c) => (
                <CampoFormulario key={c.key} campo={c} valor={d[c.key] ?? ''} error={errDet[i]?.[c.key]} onChange={cambiarDetalle(i, c.key)} esEdicion={esEdicion} />
              ))}
            </View>
          ))}
          <Boton compacto variante="secundario" icono="＋" titulo="Agregar ítem"
            onPress={() => setDetalles((p) => [...p, valoresVacios(t.detalle.campos)])} />
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
  filaDetalle: { backgroundColor: colors.background, borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  filaCabecera: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  numero: { fontWeight: '800', color: colors.brown },
  quitar: { color: colors.danger, fontWeight: '700' },
});
