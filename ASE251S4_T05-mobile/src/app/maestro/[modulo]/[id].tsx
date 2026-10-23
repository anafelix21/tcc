import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MAESTROS } from '../../../modules/maestros';
import { maestroService } from '../../../services/crudService';
import { useCarga } from '../../../hooks/useCarga';
import { Cargando, FilaDato, Insignia, MensajeError, Tarjeta, Titulo } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors } from '../../../theme/colors';
import { avisar, confirmar } from '../../../utils/dialogs';

export default function MaestroDetalleScreen() {
  const { modulo, id } = useLocalSearchParams<{ modulo: string; id: string }>();
  const m = MAESTROS[modulo];
  const { datos: r, setDatos, error } = useCarga(() => maestroService.obtener(m, id), [m, id]);
  const [procesando, setProcesando] = useState(false);

  if (error) return <View style={{ padding: 16 }}><MensajeError mensaje={error} /></View>;
  if (!r) return <Cargando />;
  const resumen = m.resumen(r);

  const eliminar = async () => {
    const ok = await confirmar(`Eliminar ${m.singular}`, `¿Desea eliminar "${resumen.titulo}"? Podrá restaurarlo desde la pestaña Eliminados.`);
    if (!ok) return;
    setProcesando(true);
    try {
      await maestroService.eliminar(m, id);
      avisar('Eliminado', `"${resumen.titulo}" pasó a la lista de eliminados.`);
      router.back();
    } catch (e) {
      avisar('No se pudo eliminar', (e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  const restaurar = async () => {
    setProcesando(true);
    try {
      setDatos(await maestroService.restaurar(m, id));
      avisar('Restaurado', `"${resumen.titulo}" está activo nuevamente.`);
    } catch (e) {
      avisar('No se pudo restaurar', (e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: `Detalle de ${m.singular}` }} />
      <Tarjeta style={styles.hero}>
        <Text style={styles.icono}>{m.icono}</Text>
        <Text style={styles.titulo}>{resumen.titulo}</Text>
        {resumen.subtitulo ? <Text style={styles.sub}>{resumen.subtitulo}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Insignia texto={r.estado ? '● Activo' : '● Eliminado'} tono={r.estado ? 'verde' : 'rojo'} />
          {resumen.insignia ? <Insignia texto={resumen.insignia} tono="tierra" /> : null}
        </View>
      </Tarjeta>

      <Tarjeta>
        <Titulo>Información</Titulo>
        {m.filas(r).map(([etiqueta, valor]) => <FilaDato key={etiqueta} etiqueta={etiqueta} valor={valor} />)}
      </Tarjeta>

      <Tarjeta>
        <Titulo>Auditoría</Titulo>
        <FilaDato etiqueta="Creado" valor={r.createdAt} />
        <FilaDato etiqueta="Actualizado" valor={r.updatedAt} />
        <FilaDato etiqueta="Eliminado" valor={r.deletedAt} />
        <FilaDato etiqueta="Restaurado" valor={r.restoredAt} />
      </Tarjeta>

      {r.estado ? (
        <View style={{ gap: 10 }}>
          <Boton titulo="Editar" icono="✎"
            onPress={() => router.push({ pathname: '/maestro/[modulo]/formulario', params: { modulo: m.clave, id } })} />
          <Boton titulo="Eliminar" icono="🗑" variante="peligro" onPress={eliminar} cargando={procesando} />
          {m.notaEliminar ? <Text style={styles.nota}>{m.notaEliminar}</Text> : null}
        </View>
      ) : (
        <Boton titulo="Restaurar" icono="↺" onPress={restaurar} cargando={procesando} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { alignItems: 'center', backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  icono: { fontSize: 36 },
  titulo: { fontSize: 22, fontWeight: '900', color: colors.primaryDark, textAlign: 'center', marginTop: 6 },
  sub: { color: colors.muted, marginTop: 2, textAlign: 'center' },
  nota: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
