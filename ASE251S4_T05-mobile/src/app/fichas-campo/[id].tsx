import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FICHAS_CAMPO_MODULO } from '../../modules/fichasCampo';
import { fichaCampoService } from '../../services/crudService';
import { useAuth } from '../../context/AuthContext';
import { puedeGestionarFichasCampo } from '../../utils/permisos';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, FilaDato, Insignia, MensajeError, Tarjeta, Titulo } from '../../components/ui';
import { Boton } from '../../components/Boton';
import { Icono } from '../../components/Icono';
import { colors, radius } from '../../theme/colors';
import { avisar, confirmar } from '../../utils/dialogs';

export default function FichaCampoDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = FICHAS_CAMPO_MODULO;
  const { usuario } = useAuth();
  const puedeGestionar = puedeGestionarFichasCampo(usuario);

  const { datos: r, setDatos, error } = useCarga(() => fichaCampoService.obtener(id), [id]);
  const [procesando, setProcesando] = useState(false);

  if (error) return <View style={{ padding: 16 }}><MensajeError mensaje={error} /></View>;
  if (!r) return <Cargando />;
  const resumen = m.resumen(r);

  const eliminar = async () => {
    if (!puedeGestionar) return;
    if (!(await confirmar('Dar de baja ficha', `¿Desea dar de baja "${resumen.titulo}"? Podrá restaurarla luego.`))) return;
    setProcesando(true);
    try {
      await fichaCampoService.eliminar(id);
      avisar('Ficha archivada', `"${resumen.titulo}" pasó a la lista de eliminados.`);
      router.back();
    } catch (e) {
      avisar('Error al archivar', (e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  const restaurar = async () => {
    if (!puedeGestionar) return;
    setProcesando(true);
    try {
      setDatos(await fichaCampoService.restaurar(id));
      avisar('Ficha restaurada', `"${resumen.titulo}" está activa nuevamente.`);
    } catch (e) {
      avisar('Error al restaurar', (e as Error).message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      <Stack.Screen options={{ title: 'Detalle de Ficha de Campo' }} />

      {/* Hero Card */}
      <Tarjeta style={styles.hero}>
        <View style={styles.iconoWrap}>
          <Icono name="clipboard" size={32} color={colors.primary} />
        </View>
        <Text style={styles.titulo}>{resumen.titulo}</Text>
        <Text style={styles.sub}>{resumen.subtitulo}</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Insignia texto={r.estado !== false ? 'Activo' : 'Dado de baja'} tono={r.estado !== false ? 'verde' : 'rojo'} />
          <Insignia
            texto={r.estadoCultivo ?? 'EVALUADO'}
            tono={r.estadoCultivo === 'OPTIMO' ? 'verde' : r.estadoCultivo === 'CRITICO' ? 'rojo' : 'tierra'}
          />
          {!puedeGestionar ? <Insignia texto="Solo lectura" tono="tierra" /> : null}
        </View>
      </Tarjeta>

      {/* Alertas Fitosanitarias y de Riego */}
      <Tarjeta>
        <Titulo>Condición y Requerimientos</Titulo>
        <View style={styles.alertasGrid}>
          <View style={[styles.alertaBox, r.necesitaRiego ? styles.alertaBoxWarn : styles.alertaBoxOk]}>
            <Icono name="water" size={20} color={r.necesitaRiego ? colors.warning : colors.primary} />
            <Text style={styles.alertaTitulo}>Riego</Text>
            <Text style={styles.alertaEstado}>{r.necesitaRiego ? 'Urgente' : 'Normal'}</Text>
          </View>
          <View style={[styles.alertaBox, r.necesitaFumigacion ? styles.alertaBoxDanger : styles.alertaBoxOk]}>
            <Icono name="shield-checkmark" size={20} color={r.necesitaFumigacion ? colors.danger : colors.primary} />
            <Text style={styles.alertaTitulo}>Fumigación</Text>
            <Text style={styles.alertaEstado}>{r.necesitaFumigacion ? 'Requerida' : 'Controlada'}</Text>
          </View>
        </View>
      </Tarjeta>

      {/* Información de la Ficha */}
      <Tarjeta>
        <Titulo>Datos de la Evaluación Técnica</Titulo>
        {m.filas(r).map(([etiqueta, valor]) => (
          <FilaDato key={etiqueta} etiqueta={etiqueta} valor={valor} />
        ))}
      </Tarjeta>

      {/* Diagnóstico y Acciones */}
      <Tarjeta>
        <Titulo>Diagnóstico y Recomendaciones</Titulo>
        <View style={styles.seccionTexto}>
          <Text style={styles.seccionLbl}>Diagnóstico:</Text>
          <Text style={styles.seccionVal}>{r.diagnostico || 'Sin observaciones registradas'}</Text>
        </View>
        <View style={styles.seccionTexto}>
          <Text style={styles.seccionLbl}>Acción Tomada:</Text>
          <Text style={styles.seccionVal}>{r.accionTomada || 'Sin acciones inmediatas'}</Text>
        </View>
        <View style={styles.seccionTexto}>
          <Text style={styles.seccionLbl}>Acción Pendiente:</Text>
          <Text style={styles.seccionVal}>{r.accionPendiente || 'Sin recomendaciones pendientes'}</Text>
        </View>
      </Tarjeta>

      {/* Botones de Acción */}
      {puedeGestionar ? (
        r.estado !== false ? (
          <View style={{ gap: 10, marginTop: 4 }}>
            <Boton
              titulo="Editar Ficha"
              icono="create-outline"
              onPress={() => router.push({ pathname: '/fichas-campo/formulario', params: { id } })}
            />
            <Boton titulo="Archivar Ficha" icono="trash-outline" variante="peligro" onPress={eliminar} cargando={procesando} />
          </View>
        ) : (
          <Boton titulo="Restaurar Ficha" icono="refresh-outline" onPress={restaurar} cargando={procesando} />
        )
      ) : (
        <Tarjeta style={styles.avisoSoloLectura}>
          <Icono name="eye-outline" size={20} color="#6D4C2F" />
          <Text style={styles.avisoSoloLecturaTexto}>
            Modo Consulta: Su rol ({usuario ? usuario.rol : 'Invitado'}) cuenta únicamente con permisos de lectura para evaluaciones fitosanitarias.
          </Text>
        </Tarjeta>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border },
  iconoWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titulo: { fontSize: 20, fontWeight: '900', color: colors.text, textAlign: 'center' },
  sub: { color: colors.muted, marginTop: 3, textAlign: 'center', fontSize: 13 },
  alertasGrid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  alertaBox: { flex: 1, padding: 12, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  alertaBoxOk: { backgroundColor: colors.primarySoft, borderColor: colors.border },
  alertaBoxWarn: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  alertaBoxDanger: { backgroundColor: colors.dangerSoft, borderColor: '#FECACA' },
  alertaTitulo: { fontSize: 12, color: colors.muted, marginTop: 4, fontWeight: '600' },
  alertaEstado: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 2 },
  seccionTexto: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  seccionLbl: { fontSize: 12, color: colors.muted, fontWeight: '700', marginBottom: 2 },
  seccionVal: { fontSize: 14, color: colors.text, lineHeight: 20 },
  avisoSoloLectura: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.brownSoft,
    borderColor: colors.brownLight,
    padding: 14,
    marginTop: 4,
  },
  avisoSoloLecturaTexto: {
    flex: 1,
    color: '#6D4C2F',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
