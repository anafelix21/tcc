import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FICHAS_CAMPO_MODULO } from '../../modules/fichasCampo';
import { fichaCampoService } from '../../services/crudService';
import { useAuth } from '../../context/AuthContext';
import { puedeGestionarFichasCampo } from '../../utils/permisos';
import { FormValores } from '../../modules/types';
import { CampoFormulario } from '../../components/CampoFormulario';
import { Cargando, MensajeError, Tarjeta, Titulo } from '../../components/ui';
import { Boton } from '../../components/Boton';
import { colors } from '../../theme/colors';
import { aPayload, aValores, validar, valoresVacios } from '../../utils/formularios';
import { avisar } from '../../utils/dialogs';

export default function FichaCampoFormularioScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const m = FICHAS_CAMPO_MODULO;
  const { usuario } = useAuth();
  const puedeGestionar = puedeGestionarFichasCampo(usuario);

  const esEdicion = Boolean(id);
  const [valores, setValores] = useState<FormValores>(() => {
    const v = valoresVacios(m.campos);
    v.fechaRegistro = new Date().toISOString().split('T')[0];
    v.etapaFenologica = 'CRECIMIENTO';
    v.estadoCultivo = 'OPTIMO';
    v.condicionClima = 'SOLEADO';
    return v;
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(esEdicion);
  const [guardando, setGuardando] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fichaCampoService
      .obtener(id)
      .then((r) => setValores(aValores(m.campos, r)))
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false));
  }, [id, m]);

  if (!puedeGestionar) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 14 }}>
        <Stack.Screen options={{ title: 'Acceso Restringido' }} />
        <MensajeError mensaje={`Acceso restringido: Su rol (${usuario?.rol || 'Invitado'}) no cuenta con permisos para crear o modificar fichas técnicas de campo. Solo el agrónomo, técnico o supervisor pueden realizar esta acción.`} />
        <Boton titulo="Regresar" onPress={() => router.back()} />
      </View>
    );
  }

  const guardar = async () => {
    const e = validar(m.campos, valores, esEdicion);
    setErrores(e);
    if (Object.keys(e).length > 0) return;

    setGuardando(true);
    setErrorApi(null);
    try {
      const payload = aPayload(m.campos, valores);
      if (payload.idCultivo) payload.idCultivo = Number(payload.idCultivo);

      const r = esEdicion
        ? await fichaCampoService.editar(id!, payload)
        : await fichaCampoService.registrar(payload);

      avisar(
        esEdicion ? 'Ficha actualizada' : 'Ficha registrada',
        `"${m.resumen(r).titulo}" se guardó correctamente.`
      );
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
      <Stack.Screen options={{ title: `${esEdicion ? 'Editar' : 'Nueva'} Ficha de Campo` }} />
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Tarjeta>
          <Titulo>Datos de la Ficha Técnica</Titulo>
          {m.campos.map((c) => (
            <CampoFormulario
              key={c.key}
              campo={c}
              valor={valores[c.key] ?? ''}
              error={errores[c.key]}
              esEdicion={esEdicion}
              onChange={(v) => {
                setValores((p) => ({ ...p, [c.key]: v }));
                setErrores((p) => ({ ...p, [c.key]: '' }));
              }}
            />
          ))}
        </Tarjeta>

        {errorApi ? <MensajeError mensaje={errorApi} /> : null}

        <View style={{ gap: 10 }}>
          <Boton titulo={esEdicion ? 'Guardar Cambios' : 'Registrar Ficha'} icono="checkmark-circle-outline" onPress={guardar} cargando={guardando} />
          <Boton titulo="Cancelar" variante="tierra" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
});
