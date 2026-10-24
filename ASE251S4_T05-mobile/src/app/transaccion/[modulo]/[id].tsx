import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { TRANSACCIONES } from '../../../modules/transacciones';
import { cargarCatalogo, Opcion, transaccionService } from '../../../services/crudService';
import { useAuth } from '../../../context/AuthContext';
import { puedeGestionarMaestroOTransaccion } from '../../../utils/permisos';
import { useCarga } from '../../../hooks/useCarga';
import { Cargando, FilaDato, Insignia, MensajeError, Tarjeta, Titulo } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { Icono } from '../../../components/Icono';
import { colors, radius } from '../../../theme/colors';
import { avisar, confirmar } from '../../../utils/dialogs';

export default function TransaccionDetalleScreen() {
  const { modulo, id } = useLocalSearchParams<{ modulo: string; id: string }>();
  const t = TRANSACCIONES[modulo];
  const { usuario } = useAuth();
  const puedeGestionar = puedeGestionarMaestroOTransaccion(usuario);

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
    if (!puedeGestionar) return;
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
    if (!puedeGestionar) return;
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
        <View style={styles.contenedorIcono}>
          <Icono name={t.icono.name as any} family={t.icono.family} size={36} color="#5D4027" />
        </View>
        <Text style={styles.titulo}>{resumen.titulo}</Text>
        {resumen.valor ? <Text style={styles.valor}>{resumen.valor}</Text> : null}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Insignia texto={r.estado ? '● Activo' : '● Dado de baja'} tono={r.estado ? 'verde' : 'rojo'} />
          {resumen.insignia ? <Insignia texto={resumen.insignia} tono="tierra" /> : null}
          {!puedeGestionar ? <Insignia texto="Solo lectura" tono="tierra" /> : null}
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

      {puedeGestionar ? (
        r.estado ? (
          <View style={{ gap: 10 }}>
            <Boton titulo="Editar" icono="create-outline"
              onPress={() => router.push({ pathname: '/transaccion/[modulo]/formulario', params: { modulo: t.clave, id } })} />
            <Boton titulo="Dar de baja" icono="trash-outline" variante="peligro" onPress={eliminar} cargando={procesando} />
          </View>
        ) : (
          <Boton titulo="Restaurar" icono="refresh-outline" onPress={restaurar} cargando={procesando} />
        )
      ) : (
        <Tarjeta style={styles.avisoSoloLectura}>
          <Icono name="eye-outline" size={20} color="#6D4C2F" />
          <Text style={styles.avisoSoloLecturaTexto}>
            Modo Consulta: Su rol ({usuario ? usuario.rol : 'Invitado'}) cuenta únicamente con permisos de lectura para esta transacción.
          </Text>
        </Tarjeta>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { alignItems: 'center', backgroundColor: colors.brownSoft, borderColor: colors.brownSoft },
  contenedorIcono: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  titulo: { fontSize: 21, fontWeight: '900', color: '#5D4027', textAlign: 'center', marginTop: 6 },
  valor: { fontSize: 18, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  detalle: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.md, padding: 12, marginBottom: 8, gap: 10 },
  detalleTitulo: { fontWeight: '700', color: colors.text },
  detalleSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  detalleValor: { fontWeight: '800', color: colors.primaryDark },
  avisoSoloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brownSoft,
    borderColor: colors.brownLight,
    padding: 14,
  },
  avisoSoloLecturaTexto: {
    flex: 1,
    color: '#6D4C2F',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
