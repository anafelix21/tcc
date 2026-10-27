import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
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
  const [filtro, setFiltro] = useState<'pendientes' | 'en_proceso' | 'culminadas' | 'todas'>('pendientes');
  const [finalizandoId, setFinalizandoId] = useState<number | null>(null);
  // Estado local para seguimiento en vivo del flujo de operario: 'pendiente' | 'en_proceso' | 'completado'
  const [estadosLabor, setEstadosLabor] = useState<Record<number, 'pendiente' | 'en_proceso' | 'completado'>>({});

  const { datos, cargando, error, recargar } = useCarga(
    () => actividadOperarioService.listarMisLabores(usuario?.id),
    [usuario?.id]
  );

  const lista = datos ?? [];

  const getEstadoLabor = (item: any): 'pendiente' | 'en_proceso' | 'completado' => {
    if (item.completado) return 'completado';
    return estadosLabor[item.idActividad] || 'pendiente';
  };

  const cambiarEstado = async (item: any, nuevoEstado: 'pendiente' | 'en_proceso' | 'completado') => {
    const estadoActual = getEstadoLabor(item);
    if (estadoActual === nuevoEstado) return;

    if (nuevoEstado === 'completado') {
      await finalizar(item);
      return;
    }

    // Actualizar estado local en vivo (ej. En Proceso o Pendiente)
    setEstadosLabor((prev) => ({
      ...prev,
      [item.idActividad]: nuevoEstado,
    }));

    if (nuevoEstado === 'en_proceso') {
      avisar(
        'Labor En Proceso',
        `Ha iniciado la labor "${item.tipoActividad}" en el lote/cultivo "${item.nombreCultivo ?? 'de campo'}". Recuerde finalizarla al terminar la jornada.`
      );
    }
  };

  const filtrados = lista.filter((a: any) => {
    const st = getEstadoLabor(a);
    if (filtro === 'pendientes') return st === 'pendiente';
    if (filtro === 'en_proceso') return st === 'en_proceso';
    if (filtro === 'culminadas') return st === 'completado';
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
      setEstadosLabor((prev) => ({ ...prev, [id]: 'completado' }));
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
            <View style={{ marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
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
            <Text style={styles.perfilSub}>Flujo Diario del Operario · Tareas asignadas</Text>
          </View>
          {/* Botón directo a Nueva Ficha de Campo */}
          <Boton
            compacto
            titulo="+ Ficha"
            variante="primario"
            icono="add-circle-outline"
            onPress={() => router.push('/fichas-campo/formulario')}
          />
        </View>

        {/* Selector de Pestañas Flujo Operario */}
        <View style={styles.chipsFiltro}>
          {(['pendientes', 'en_proceso', 'culminadas', 'todas'] as const).map((f) => {
            const label =
              f === 'pendientes'
                ? 'Pendientes'
                : f === 'en_proceso'
                ? 'En Proceso'
                : f === 'culminadas'
                ? 'Completadas'
                : 'Todas';
            const isActive = filtro === f;
            return (
              <Boton
                key={f}
                compacto
                variante={isActive ? 'primario' : 'tierra'}
                titulo={label}
                onPress={() => setFiltro(f)}
                style={{ flex: 1 }}
              />
            );
          })}
        </View>
      </View>

      {cargando && !datos ? (
        <Cargando />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(a) => String(a.idActividad)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
          refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} tintColor={colors.primary} />}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.contador}>
                {filtrados.length} labor(es) en estado <Text style={{ color: colors.primaryDark, fontWeight: '800' }}>{filtro.replace('_', ' ')}</Text>
              </Text>
              <Text style={styles.listHeaderTip}>Toque un estado para alternar en 1 clic el ciclo de vida</Text>
            </View>
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
                    : filtro === 'en_proceso'
                    ? 'No tiene labores en ejecución activa actualmente.'
                    : 'No hay labores registradas en esta vista.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => {
            const estadoActual = getEstadoLabor(item);
            const esFinalizada = estadoActual === 'completado';
            const esEnProceso = estadoActual === 'en_proceso';

            return (
              <Tarjeta style={styles.laborCard}>
                <View style={styles.laborTop}>
                  <View
                    style={[
                      styles.laborIcono,
                      esEnProceso && { backgroundColor: '#FEF3C7' },
                      esFinalizada && { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <Icono
                      name={
                        item.tipoActividad === 'Riego'
                          ? 'water-outline'
                          : esEnProceso
                          ? 'timer-outline'
                          : 'construct-outline'
                      }
                      size={24}
                      color={esEnProceso ? '#D97706' : esFinalizada ? colors.primaryDark : colors.brown}
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
                    texto={esFinalizada ? 'Completado' : esEnProceso ? 'En Proceso' : 'Pendiente'}
                    tono={esFinalizada ? 'verde' : esEnProceso ? 'rojo' : 'tierra'}
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

                {/* ============================================================== */}
                {/* CONTROL TÁCTIL DE 1 CLIC: [Pendiente] ➔ [En Proceso] ➔ [Completado] */}
                {/* ============================================================== */}
                <View style={styles.tactilFlowContainer}>
                  <Text style={styles.tactilFlowTitle}>Flujo Operativo (Alternar en 1 clic):</Text>
                  <View style={styles.tactilButtonsRow}>
                    {/* Botón Pendiente */}
                    <Pressable
                      disabled={esFinalizada}
                      onPress={() => cambiarEstado(item, 'pendiente')}
                      style={[
                        styles.tactilBtn,
                        estadoActual === 'pendiente' && styles.tactilBtnActivePendiente,
                        esFinalizada && { opacity: 0.4 },
                      ]}
                    >
                      <Icono
                        name="time-outline"
                        size={15}
                        color={estadoActual === 'pendiente' ? '#8C5A3C' : colors.muted}
                      />
                      <Text
                        style={[
                          styles.tactilBtnText,
                          estadoActual === 'pendiente' && styles.tactilBtnTextActivePendiente,
                        ]}
                      >
                        Pendiente
                      </Text>
                    </Pressable>

                    <Icono name="arrow-forward" size={14} color={colors.border} />

                    {/* Botón En Proceso */}
                    <Pressable
                      disabled={esFinalizada}
                      onPress={() => cambiarEstado(item, 'en_proceso')}
                      style={[
                        styles.tactilBtn,
                        estadoActual === 'en_proceso' && styles.tactilBtnActiveProceso,
                        esFinalizada && { opacity: 0.4 },
                      ]}
                    >
                      <Icono
                        name="play-circle-outline"
                        size={15}
                        color={estadoActual === 'en_proceso' ? '#D97706' : colors.muted}
                      />
                      <Text
                        style={[
                          styles.tactilBtnText,
                          estadoActual === 'en_proceso' && styles.tactilBtnTextActiveProceso,
                        ]}
                      >
                        En Proceso
                      </Text>
                    </Pressable>

                    <Icono name="arrow-forward" size={14} color={colors.border} />

                    {/* Botón Completado */}
                    <Pressable
                      onPress={() => cambiarEstado(item, 'completado')}
                      style={[
                        styles.tactilBtn,
                        estadoActual === 'completado' && styles.tactilBtnActiveCompletado,
                      ]}
                    >
                      <Icono
                        name="checkmark-circle-outline"
                        size={15}
                        color={estadoActual === 'completado' ? colors.primaryDark : colors.muted}
                      />
                      <Text
                        style={[
                          styles.tactilBtnText,
                          estadoActual === 'completado' && styles.tactilBtnTextActiveCompletado,
                        ]}
                      >
                        Completado
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Banner de Estado Final */}
                {esFinalizada ? (
                  <View style={styles.finalizadaBanner}>
                    <Icono name="checkmark-circle" size={18} color={colors.primaryDark} />
                    <Text style={styles.finalizadaTexto}>Labor completada · Insumos descargados de almacén</Text>
                  </View>
                ) : esEnProceso ? (
                  <View style={styles.enProcesoBanner}>
                    <Icono name="flash-outline" size={18} color="#D97706" />
                    <Text style={styles.enProcesoTexto}>Labor en ejecución · Toque [Completado] al finalizar</Text>
                  </View>
                ) : (
                  <View style={{ marginTop: 12 }}>
                    <Boton
                      titulo="Finalizar y Registrar Descargo"
                      icono="checkmark-done-circle-outline"
                      onPress={() => finalizar(item)}
                      cargando={finalizandoId === item.idActividad}
                    />
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
  enProcesoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: radius.md,
    marginTop: 12,
    justifyContent: 'center',
  },
  enProcesoTexto: { fontSize: 13, color: '#D97706', fontWeight: '700' },
  listHeader: { marginBottom: 10 },
  listHeaderTip: { fontSize: 11, color: colors.brownLight, fontWeight: '600' },
  tactilFlowContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tactilFlowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tactilButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tactilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  tactilBtnActivePendiente: {
    backgroundColor: '#E8D5C4',
    borderWidth: 1,
    borderColor: '#C28D66',
  },
  tactilBtnActiveProceso: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  tactilBtnActiveCompletado: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tactilBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  tactilBtnTextActivePendiente: {
    color: '#6D4C2F',
  },
  tactilBtnTextActiveProceso: {
    color: '#B45309',
  },
  tactilBtnTextActiveCompletado: {
    color: colors.primaryDark,
  },
});

