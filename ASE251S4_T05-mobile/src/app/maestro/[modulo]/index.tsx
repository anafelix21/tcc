import { useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { MAESTROS } from '../../../modules/maestros';
import { maestroService } from '../../../services/crudService';
import { urlDescarga } from '../../../services/apiClient';
import { useAuth } from '../../../context/AuthContext';
import { puedeGestionarMaestroOTransaccion } from '../../../utils/permisos';
import { useCarga } from '../../../hooks/useCarga';
import { Buscador, Cargando, Insignia, ItemLista, MensajeError, Pestanas } from '../../../components/ui';
import { Boton } from '../../../components/Boton';
import { colors } from '../../../theme/colors';
import { avisar } from '../../../utils/dialogs';

export default function MaestroListaScreen() {
  const { modulo } = useLocalSearchParams<{ modulo: string }>();
  const m = MAESTROS[modulo];
  const { usuario } = useAuth();
  const puedeGestionar = puedeGestionarMaestroOTransaccion(usuario);

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
    if (!puedeGestionar) return;
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
      <Stack.Screen
        options={{
          title: m.titulo,
          headerRight: () => (!puedeGestionar ? <Insignia texto="Solo lectura" tono="tierra" /> : null),
        }}
      />
      <View style={styles.cabecera}>
        <Pestanas activos={activos} onChange={setActivos} />
        <Buscador valor={busqueda} onChange={setBusqueda} />
        <View style={styles.acciones}>
          {puedeGestionar ? (
            <Boton compacto variante="tierra" icono="cloud-upload-outline" titulo="Importar" onPress={importar} cargando={importando} style={{ flex: 1 }} />
          ) : null}
          <Boton compacto variante="contorno" icono="download-outline" titulo="Excel" onPress={() => Linking.openURL(urlDescarga(`${m.endpoint}/exportar/excel`))} style={{ flex: 1 }} />
          <Boton compacto variante="contorno" icono="document-text-outline" titulo="PDF" onPress={() => Linking.openURL(urlDescarga(`${m.endpoint}/exportar/pdf`))} style={{ flex: 1 }} />
        </View>
      </View>

      {cargando && !datos ? <Cargando /> : (
        <FlatList
          data={filtrados}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.lista, !puedeGestionar && { paddingBottom: 30 }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.contador}>{filtrados.length} registro(s) {activos ? 'activos' : 'eliminados'}</Text>
              {!puedeGestionar ? <Text style={styles.avisoLectura}>Modo consulta técnica</Text> : null}
            </View>
          }
          ListEmptyComponent={error ? <MensajeError mensaje={error} /> : <Text style={styles.vacio}>No hay registros para mostrar</Text>}
          renderItem={({ item }) => (
            <ItemLista resumen={m.resumen(item)} inactivo={!activos}
              onPress={() => router.push({ pathname: '/maestro/[modulo]/[id]', params: { modulo: m.clave, id: item.id } })} />
          )}
        />
      )}

      {activos && puedeGestionar ? (
        <View style={styles.pie}>
          <Boton titulo={`Registrar ${m.singular}`} icono="add-circle-outline"
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
  contador: { color: colors.muted, fontSize: 12 },
  avisoLectura: { color: colors.muted, fontSize: 11, fontStyle: 'italic' },
  vacio: { textAlign: 'center', color: colors.muted, marginTop: 30 },
  pie: { position: 'absolute', left: 16, right: 16, bottom: 20 },
});
