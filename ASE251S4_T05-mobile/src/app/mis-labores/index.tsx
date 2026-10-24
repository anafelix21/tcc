import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { actividadOperarioService } from '../../services/crudService';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, Insignia, MensajeError, Tarjeta } from '../../components/ui';
import { Boton } from '../../components/Boton';
import { Icono } from '../../components/Icono';
import { colors, radius, shadow } from '../../theme/colors';
import { avisar, confirmar } from '../../utils/dialogs';
import { soles } from '../../utils/formato';

export default function MisLaboresScreen() {
  const { usuario } = useAuth();
  const [filtro, setFiltro] = useState<'pendientes' | 'culminadas' | 'todas'>('pendientes');
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);

  const { datos, cargando, error, recargar } = useCarga(
    () => actividadOperarioService.listarMisLabores(usuario?.id),
    [usuario?.id]
  );

  const lista = datos ?? [];
  const filtrados = lista.filter((a: any) => {
    if (filtro === 'pendientes') return !a.completado;
    if (filtro === 'culminadas') return a.completado;
    return true;
  });

  const finalizar = async (actividad: any) => {
    const id = actividad.idActividad;
    const ok = await confirmar(
      'Finalizar labor agrícola',
      `¿Confirma que culminó la labor "${actividad.tipoActividad}" en el cultivo "${actividad.nombreCultivo ?? 'de campo'}"? Se descontarán automáticamente los insumos utilizados.`
    );
    if (!ok) return;

    setFinalizandoId(id);
    try {
      await actividadOperarioService.finalizarLabor(id);
      avisar(
        'Labor completada con éxito',
        'La labor fue registrada como finalizada y el inventario de insumos fue actualizado automáticamente en el sistema.'
      );
      recargar();
    } catch (e) {
      avisar('Error al finalizar labor', (e as Error).message);
    } finally {
      setFinalizandoId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen
        options={{
          title: 'Mis Labores de Campo',
          headerBackTitle: 'Inicio',
          headerRight: () => (
            <View style={{ marginRight: 8 }}>
              <Icono name="checkmark-done-circle-outline" size={24} color={colors.white} />
            </View>
          ),
        }}
      />

      <View style={styles.cabecera}>
        <View style={styles.perfilBarra}>
          <Icono name="person-circle-outline" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.perfilNombre}>{usuario ? usuario.nombre : 'Operario de Campo'}</Text>
            <Text style={styles.perfilSub}>Tareas de campo asignadas para hoy</Text>
          </View>
        </View>

        {/* Selector de Pestañas */}
        <View style={styles.chipsFiltro}>
          {(['pendientes', 'culminadas', 'todas'] as const).map((f) => (
            <Boton
              key={f}
              compacto
              variante={filtro === f ? 'primario' : 'tierra'}
              titulo={f === 'pendientes' ? 'Pendientes' : f === 'culminadas' ? 'Finalizadas' : 'Todas'}
              onPress={() => setFiltro(f)}
              style={{ flex: 1 }}
            />
          ))}
        </View>
      </View>

      {cargando && !datos ? (
        <Cargando />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(a) => String(a.idActividad)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={
            <Text style={styles.contador}>
              {filtrados.length} labor(es) {filtro}
            </Text>
          }
          ListEmptyComponent={
            error ? (
              <MensajeError mensaje={error} />
            ) : (
              <View style={styles.vacioCard}>
                <Icono name="checkmark-circle-outline" size={48} color={colors.primary} />
                <Text style={styles.vacioTitulo}>¡Al día con las labores!</Text>
                <Text style={styles.vacioTexto}>
                  {filtro === 'pendientes'
                    ? 'No tiene labores pendientes en este momento.'
                    : 'No hay labores registradas en esta vista.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const esFinalizada = Boolean(item.completado);
            return (
              <Tarjeta style={styles.laborCard}>
                <View style={styles.laborTop}>
                  <View style={styles.laborIcono}>
                    <Icono
                      name={item.tipoActividad === 'Riego' ? 'water-outline' : 'construct-outline'}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.laborTitulo}>{item.tipoActividad}</Text>
                    <Text style={styles.laborCultivo}>
                      Cultivo: <Text style={{ fontWeight: '800' }}>{item.nombreCultivo ?? `#${item.idCultivo}`}</Text>
                    </Text>
                    <Text style={styles.laborFecha}>Fecha: {item.fechaActividad}</Text>
                  </View>
                  <Insignia
                    texto={esFinalizada ? 'Culminada' : 'Pendiente'}
                    tono={esFinalizada ? 'verde' : 'tierra'}
                  />
                </View>

                {item.descripcion ? (
                  <Text style={styles.laborDesc}>{item.descripcion}</Text>
                ) : null}

                {/* Insumos a utilizar */}
                {item.detalles && item.detalles.length > 0 ? (
                  <View style={styles.insumosBox}>
                    <Text style={styles.insumosBoxTitulo}>Insumos asignados para esta labor:</Text>
                    {item.detalles.map((d: any, idx: number) => (
                      <View key={idx} style={styles.insumoFila}>
                        <Icono name="flask-outline" size={16} color={colors.primary} />
                        <Text style={styles.insumoNombre}>{d.nombreInsumo ?? `Insumo #${d.idInsumo}`}</Text>
                        <Text style={styles.insumoCantidad}>
                          {d.cantidad} {d.unidadMedida ?? 'und.'}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Botón de Acción para el Operario */}
                {!esFinalizada ? (
                  <View style={{ marginTop: 12 }}>
                    <Boton
                      titulo="Marcar como Finalizada"
                      icono="checkmark-done-circle-outline"
                      onPress={() => finalizar(item)}
                      cargando={finalizandoId === item.idActividad}
                    />
                  </View>
                ) : (
                  <View style={styles.finalizadaBanner}>
                    <Icono name="checkmark-circle" size={18} color={colors.primary} />
                    <Text style={styles.finalizadaTexto}>Labor culminada y registrada en el sistema</Text>
                  </View>
                )}
              </Tarjeta>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  perfilBarra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primarySoft,
    padding: 12,
    borderRadius: radius.md,
  },
  perfilNombre: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  perfilSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  chipsFiltro: { flexDirection: 'row', gap: 8 },
  lista: { padding: 16, paddingBottom: 40 },
  contador: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  vacioCard: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
    gap: 8,
  },
  vacioTitulo: { fontSize: 16, fontWeight: '800', color: colors.text },
  vacioTexto: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  laborCard: { padding: 16, borderRadius: radius.lg, ...shadow },
  laborTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  laborIcono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laborTitulo: { fontSize: 16, fontWeight: '800', color: colors.text },
  laborCultivo: { fontSize: 13, color: colors.muted, marginTop: 2 },
  laborFecha: { fontSize: 12, color: colors.muted, marginTop: 1 },
  laborDesc: {
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 10,
    lineHeight: 18,
  },
  insumosBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  insumosBoxTitulo: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 6 },
  insumoFila: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  insumoNombre: { flex: 1, fontSize: 13, color: colors.text, fontWeight: '600' },
  insumoCantidad: { fontSize: 13, color: colors.primaryDark, fontWeight: '800' },
  finalizadaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primarySoft,
    padding: 10,
    borderRadius: radius.md,
    marginTop: 12,
    justifyContent: 'center',
  },
  finalizadaTexto: { fontSize: 13, color: colors.primaryDark, fontWeight: '700' },
});
