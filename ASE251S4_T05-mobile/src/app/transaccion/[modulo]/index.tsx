import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { TRANSACCIONES } from '../../../modules/transacciones';
import { transaccionService } from '../../../services/crudService';
import { useCarga } from '../../../hooks/useCarga';
import { Buscador, Cargando, ItemLista, MensajeError, Pestanas } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors } from '../../../theme/colors';

export default function TransaccionListaScreen() {
  const { modulo } = useLocalSearchParams<{ modulo: string }>();
  const t = TRANSACCIONES[modulo];
  const [activos, setActivos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { datos, cargando, error, recargar } = useCarga(() => transaccionService.listar(t, activos), [t, activos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = [...(datos ?? [])].sort((a, b) => Number(b[t.idKey]) - Number(a[t.idKey]));
    return q ? lista.filter((r) => JSON.stringify(t.resumen(r)).toLowerCase().includes(q)) : lista;
  }, [datos, busqueda, t]);

  if (!t) return <MensajeError mensaje={`Módulo "${modulo}" no existe`} />;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: t.titulo }} />
      <View style={styles.cabecera}>
        <Text style={styles.estudiante}>Módulo transaccional de {t.estudiante} · SQL Server</Text>
        <Pestanas activos={activos} onChange={setActivos} />
        <Buscador valor={busqueda} onChange={setBusqueda} />
      </View>

      {cargando && !datos ? <Cargando /> : (
        <FlatList
          data={filtrados}
          keyExtractor={(r) => String(r[t.idKey])}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={<Text style={styles.contador}>{filtrados.length} registro(s)</Text>}
          ListEmptyComponent={error ? <MensajeError mensaje={error} /> : <Text style={styles.vacio}>No hay registros para mostrar</Text>}
          renderItem={({ item }) => (
            <ItemLista resumen={t.resumen(item)} inactivo={!activos}
              onPress={() => router.push({ pathname: '/transaccion/[modulo]/[id]', params: { modulo: t.clave, id: String(item[t.idKey]) } })} />
          )}
        />
      )}

      {activos ? (
        <View style={styles.pie}>
          <Boton titulo={`Registrar ${t.singular}`} icono="＋"
            onPress={() => router.push({ pathname: '/transaccion/[modulo]/formulario', params: { modulo: t.clave } })} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { padding: 16, paddingBottom: 4, gap: 10 },
  estudiante: { fontSize: 12, color: colors.brown, fontWeight: '700' },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 110 },
  contador: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  vacio: { textAlign: 'center', color: colors.muted, marginTop: 30 },
  pie: { position: 'absolute', left: 16, right: 16, bottom: 20 },
});
