import { useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MAESTROS } from '../../../modules/maestros';
import { maestroService } from '../../../services/crudService';
import { urlDescarga } from '../../../services/apiClient';
import { useCarga } from '../../../hooks/useCarga';
import { Buscador, Cargando, ItemLista, MensajeError, Pestanas } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors } from '../../../theme/colors';
import { avisar } from '../../../utils/dialogs';

export default function MaestroListaScreen() {
  const { modulo } = useLocalSearchParams<{ modulo: string }>();
  const m = MAESTROS[modulo];
  const [activos, setActivos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [importando, setImportando] = useState(false);
  const { datos, cargando, error, recargar } = useCarga(() => maestroService.listar(m, activos), [m, activos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = datos ?? [];
    return q ? lista.filter((r) => JSON.stringify(m.resumen(r)).toLowerCase().includes(q)) : lista;
  }, [datos, busqueda, m]);

  if (!m) return <MensajeError mensaje={`Módulo "${modulo}" no existe`} />;

  const importar = async () => {
    setImportando(true);
    try {
      const r = await maestroService.importar(m);
      if (r) {
        avisar('Importación finalizada', `Filas: ${r.totalFilas}\nImportadas: ${r.importados}\nFallidas: ${r.fallidos}` +
          (r.errores?.length ? `\n\n${r.errores.slice(0, 5).join('\n')}` : ''));
        recargar();
      }
    } catch (e) {
      avisar('No se pudo importar', (e as Error).message);
    } finally {
      setImportando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: m.titulo }} />
      <View style={styles.cabecera}>
        <Pestanas activos={activos} onChange={setActivos} />
        <Buscador valor={busqueda} onChange={setBusqueda} />
        <View style={styles.acciones}>
          <Boton compacto variante="tierra" icono="⬆" titulo="Importar" onPress={importar} cargando={importando} style={{ flex: 1 }} />
          <Boton compacto variante="contorno" icono="⬇" titulo="Excel" onPress={() => Linking.openURL(urlDescarga(`${m.endpoint}/exportar/excel`))} style={{ flex: 1 }} />
          <Boton compacto variante="contorno" icono="⬇" titulo="PDF" onPress={() => Linking.openURL(urlDescarga(`${m.endpoint}/exportar/pdf`))} style={{ flex: 1 }} />
        </View>
      </View>

      {cargando && !datos ? <Cargando /> : (
        <FlatList
          data={filtrados}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={<Text style={styles.contador}>{filtrados.length} registro(s) {activos ? 'activos' : 'eliminados'}</Text>}
          ListEmptyComponent={error ? <MensajeError mensaje={error} /> : <Text style={styles.vacio}>No hay registros para mostrar</Text>}
          renderItem={({ item }) => (
            <ItemLista resumen={m.resumen(item)} inactivo={!activos}
              onPress={() => router.push({ pathname: '/maestro/[modulo]/[id]', params: { modulo: m.clave, id: item.id } })} />
          )}
        />
      )}

      {activos ? (
        <View style={styles.pie}>
          <Boton titulo={`Registrar ${m.singular}`} icono="＋"
            onPress={() => router.push({ pathname: '/maestro/[modulo]/formulario', params: { modulo: m.clave } })} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { padding: 16, paddingBottom: 4, gap: 10 },
  acciones: { flexDirection: 'row', gap: 8 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 110 },
  contador: { color: colors.muted, fontSize: 12, marginBottom: 8 },
  vacio: { textAlign: 'center', color: colors.muted, marginTop: 30 },
  pie: { position: 'absolute', left: 16, right: 16, bottom: 20 },
});
