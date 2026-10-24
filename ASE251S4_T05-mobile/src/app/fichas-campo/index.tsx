import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { FICHAS_CAMPO_MODULO } from '../../modules/fichasCampo';
import { fichaCampoService } from '../../services/crudService';
import { useAuth } from '../../context/AuthContext';
import { puedeGestionarFichasCampo } from '../../utils/permisos';
import { useCarga } from '../../hooks/useCarga';
import { Buscador, Cargando, Insignia, ItemLista, MensajeError, Pestanas } from '../../components/ui';
import { Boton } from '../../components/Boton';
import { Icono } from '../../components/Icono';
import { colors } from '../../theme/colors';

export default function FichasCampoListaScreen() {
  const m = FICHAS_CAMPO_MODULO;
  const { usuario } = useAuth();
  const puedeGestionar = puedeGestionarFichasCampo(usuario);

  const [activos, setActivos] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { datos, cargando, error, recargar } = useCarga(() => fichaCampoService.listar(activos), [activos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = [...(datos ?? [])];
    return q ? lista.filter((r) => JSON.stringify(m.resumen(r)).toLowerCase().includes(q)) : lista;
  }, [datos, busqueda, m]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Fichas de Campo',
          headerBackTitle: 'Inicio',
          headerRight: () => (
            <View style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {!puedeGestionar ? <Insignia texto="Solo lectura" tono="tierra" /> : null}
              <Icono name="clipboard-outline" size={24} color={colors.white} />
            </View>
          ),
        }}
      />
      <View style={styles.cabecera}>
        <Text style={styles.subtitulo}>
          {puedeGestionar
            ? 'Diario Técnico Agronómico · Evaluaciones Fitosanitarias'
            : 'Consulta de Evaluaciones Fitosanitarias · Modo Solo Lectura'}
        </Text>
        <Pestanas activos={activos} onChange={setActivos} />
        <Buscador valor={busqueda} onChange={setBusqueda} />
      </View>

      {cargando && !datos ? (
        <Cargando />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(r) => String(r.id || r.idFicha || Math.random())}
          contentContainerStyle={[styles.lista, !puedeGestionar && { paddingBottom: 30 }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.contador}>{filtrados.length} ficha(s) técnica(s)</Text>
              {!puedeGestionar ? <Text style={styles.avisoLectura}>Modo consulta técnica</Text> : null}
            </View>
          }
          ListEmptyComponent={
            error ? <MensajeError mensaje={error} /> : <Text style={styles.vacio}>No hay fichas de campo registradas</Text>
          }
          renderItem={({ item }) => (
            <ItemLista
              resumen={m.resumen(item)}
              inactivo={!activos}
              onPress={() =>
                router.push({
                  pathname: '/fichas-campo/[id]',
                  params: { id: String(item.id || item.idFicha) },
                })
              }
            />
          )}
        />
      )}

      {activos && puedeGestionar ? (
        <View style={styles.pie}>
          <Boton
            titulo="Nueva Ficha de Campo"
            icono="add-circle-outline"
            onPress={() => router.push('/fichas-campo/formulario')}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: { padding: 16, gap: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  subtitulo: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  lista: { padding: 16, paddingBottom: 90 },
  contador: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  avisoLectura: { color: colors.muted, fontSize: 11, fontStyle: 'italic' },
  vacio: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 14 },
  pie: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
});
