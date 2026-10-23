import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { TRANSACCIONES } from '../../../modules/transacciones';
import { cargarCatalogo, Opcion, transaccionService } from '../../../services/crudService';
import { useCarga } from '../../../hooks/useCarga';
import { Cargando, FilaDato, Insignia, MensajeError, Tarjeta, Titulo } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors, radius } from '../../../theme/colors';
import { avisar, confirmar } from '../../../utils/dialogs';

export default function TransaccionDetalleScreen() {
  const { modulo, id } = useLocalSearchParams<{ modulo: string; id: string }>();
  const t = TRANSACCIONES[modulo];
  const { datos: r, setDatos, error } = useCarga(() => transaccionService.obtener(t, id), [t, id]);
  const [procesando, setProcesando] = useState(false);
  const [catalogo, setCatalogo] = useState<Opcion[]>([]);

  // Nombres del catálogo del detalle (p. ej. cultivos de una cosecha)
  const fuente = t.detalle.campos.find((c) => c.tipo === 'seleccion')?.fuente;
  useEffect(() => {
    if (fuente) cargarCatalogo(fuente).then(setCatalogo).catch(() => setCatalogo([]));
  }, [fuente]);

  if (error) return <View style={{ padding: 16 }}><MensajeError mensaje={error} /></View>;
  if (!r) return <Cargando />;
  const resumen = t.resumen(r);
  const etiqueta = (valor: unknown) => catalogo.find((o) => o.value === String(valor))?.label;

  const eliminar = async () => {
    if (!(await confirmar(`Eliminar ${t.singular}`, `¿Desea dar de baja "${resumen.titulo}"? Podrá restaurarla luego.`))) return;
    setProcesando(true);
    try {
      await transaccionService.eliminar(t, id);
      avisar('Dado de baja', `"${resumen.titulo}" pasó a la lista de eliminados.`);
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
      setDatos(await transaccionService.restaurar(t, id));
      avisar('Restaurado', `"${resumen.titulo}" está activo nuevamente.`);
    } catch (e) {
      avisar('No se pudo restaurar', (e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: `Detalle de ${t.singular}` }} />
      <Tarjeta style={styles.hero}>
        <Text style={{ fontSize: 34 }}>{t.icono}</Text>
        <Text style={styles.titulo}>{resumen.titulo}</Text>
        {resumen.valor ? <Text style={styles.valor}>{resumen.valor}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Insignia texto={r.estado ? '● Activo' : '● Dado de baja'} tono={r.estado ? 'verde' : 'rojo'} />
          {resumen.insignia ? <Insignia texto={resumen.insignia} tono="tierra" /> : null}
        </View>
      </Tarjeta>

      <Tarjeta>
        <Titulo>Cabecera</Titulo>
        {t.filas(r).map(([e, v]) => <FilaDato key={e} etiqueta={e} valor={v} />)}
        <FilaDato etiqueta="Creado" valor={r.createdAt} />
        <FilaDato etiqueta="Actualizado" valor={r.updatedAt} />
      </Tarjeta>

      <Tarjeta>
        <Titulo>{t.detalle.titulo} ({(r.detalles ?? []).length})</Titulo>
        {(r.detalles ?? []).map((d: any, i: number) => {
          const f = t.filasDetalle(d, etiqueta);
          return (
            <View key={i} style={styles.detalle}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detalleTitulo}>{f.titulo}</Text>
                <Text style={styles.detalleSub}>{f.subtitulo}</Text>
              </View>
              {f.valor ? <Text style={styles.detalleValor}>{f.valor}</Text> : null}
            </View>
          );
        })}
      </Tarjeta>

      {r.estado ? (
        <View style={{ gap: 10 }}>
          <Boton titulo="Editar" icono="✎"
            onPress={() => router.push({ pathname: '/transaccion/[modulo]/formulario', params: { modulo: t.clave, id } })} />
          <Boton titulo="Dar de baja" icono="🗑" variante="peligro" onPress={eliminar} cargando={procesando} />
        </View>
      ) : (
        <Boton titulo="Restaurar" icono="↺" onPress={restaurar} cargando={procesando} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { alignItems: 'center', backgroundColor: colors.brownSoft, borderColor: colors.brownSoft },
  titulo: { fontSize: 21, fontWeight: '900', color: '#5D4027', textAlign: 'center', marginTop: 6 },
  valor: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  detalle: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, padding: 12, marginBottom: 8, gap: 10 },
  detalleTitulo: { fontWeight: '700', color: colors.text },
  detalleSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  detalleValor: { fontWeight: '800', color: colors.primaryDark },
});
