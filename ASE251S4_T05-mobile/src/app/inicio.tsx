import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { MAESTROS } from '../modules/maestros';
import { TRANSACCIONES } from '../modules/transacciones';
import { FICHAS_CAMPO_MODULO } from '../modules/fichasCampo';
import { Icono, IconFamily } from '../components/Icono';
import {
  esAdmin,
  esAgronomo,
  esOperario,
  esSupervisorOAdmin,
  puedeGestionarFichasCampo,
  puedeGestionarMaestroOTransaccion,
} from '../utils/permisos';
import { colors, radius, shadow } from '../theme/colors';

interface ModuloCardProps {
  iconName: string;
  iconFamily?: IconFamily;
  titulo: string;
  subtitulo: string;
  onPress: () => void;
  tono?: 'verde' | 'tierra' | 'azul';
}

function ModuloCard({ iconName, iconFamily = 'ionicons', titulo, subtitulo, onPress, tono = 'verde' }: ModuloCardProps) {
  const bgIcon = tono === 'verde' ? colors.primarySoft : tono === 'azul' ? '#E0F2FE' : colors.brownSoft;
  const colorIcon = tono === 'verde' ? colors.primaryDark : tono === 'azul' ? '#0369A1' : '#6D4C2F';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={titulo}
      onPress={onPress}
      style={({ pressed }) => [styles.modulo, pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 }]}
    >
      <View style={[styles.moduloIcono, { backgroundColor: bgIcon }]}>
        <Icono name={iconName} family={iconFamily} size={26} color={colorIcon} />
      </View>
      <Text style={styles.moduloTitulo} numberOfLines={2}>
        {titulo}
      </Text>
      <Text style={styles.moduloSub} numberOfLines={2}>
        {subtitulo}
      </Text>
    </Pressable>
  );
}

export default function InicioScreen() {
  const { usuario, cerrarSesion } = useAuth();
  const puedeEditarMaestros = puedeGestionarMaestroOTransaccion(usuario);
  const puedeEditarFichas = puedeGestionarFichasCampo(usuario);
  const operario = esOperario(usuario);
  const agronomo = esAgronomo(usuario);
  const adminOSupervisor = esSupervisorOAdmin(usuario);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primaryDark }} edges={['top']}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Header */}
        <View style={styles.hero}>
          <View style={styles.heroFila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saludo}>Hola{usuario ? `, ${usuario.nombre}` : ''}</Text>
              <View style={styles.rolBadge}>
                <Icono name="shield-checkmark-outline" size={14} color={colors.brownLight} />
                <Text style={styles.heroSub}>{usuario ? `Rol: ${usuario.rol}` : 'Modo Invitado'}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                cerrarSesion();
                router.replace('/');
              }}
              style={styles.salir}
            >
              <Icono name="log-out-outline" size={16} color={colors.white} />
              <Text style={styles.salirTexto}>{usuario ? 'Salir' : 'Ingresar'}</Text>
            </Pressable>
          </View>
        </View>

        {/* ================================================================ */}
        {/* VISTA OPERARIO: MIS LABORES DE CAMPO                            */}
        {/* ================================================================ */}
        {(operario || adminOSupervisor || !usuario) && (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Icono name="construct-outline" size={20} color={colors.primary} />
              <Text style={styles.seccionTitulo}>Labores del Operario</Text>
            </View>
            <Text style={styles.seccionSub}>Gestión y finalización de tareas de campo asignadas</Text>

            <Pressable
              style={({ pressed }) => [styles.bannerOperario, pressed && { opacity: 0.95 }]}
              onPress={() => router.push('/mis-labores')}
            >
              <View style={styles.bannerOperarioIcono}>
                <Icono name="checkmark-done-circle" size={32} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerOperarioTitulo}>Mis Labores Asignadas</Text>
                <Text style={styles.bannerOperarioSub}>
                  Vea sus actividades asignadas y márquelas como finalizadas al culminar la labor
                </Text>
              </View>
              <Icono name="chevron-forward" size={22} color={colors.primary} />
            </Pressable>
          </View>
        )}

        {/* ================================================================ */}
        {/* VISTA AGRÓNOMO / SUPERVISOR / ADMIN: FICHAS DE CAMPO            */}
        {/* ================================================================ */}
        {(agronomo || adminOSupervisor || operario || !usuario) && (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Icono name="clipboard-outline" size={20} color={colors.primary} />
              <Text style={styles.seccionTitulo}>Evaluaciones Fitosanitarias</Text>
            </View>
            <Text style={styles.seccionSub}>
              {puedeEditarFichas
                ? 'Diario técnico agronómico y control fenológico en campo'
                : 'Consulta de evaluaciones fitosanitarias de campo (Solo lectura)'}
            </Text>

            <Pressable
              style={({ pressed }) => [styles.bannerFichas, pressed && { opacity: 0.95 }]}
              onPress={() => router.push('/fichas-campo')}
            >
              <View style={styles.bannerFichasIcono}>
                <Icono name="document-text" size={30} color="#0369A1" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerFichasTitulo}>Fichas de Campo</Text>
                <Text style={styles.bannerFichasSub}>
                  {puedeEditarFichas
                    ? 'Registrar estado de cultivo, etapa fenológica, clima y diagnóstico'
                    : 'Consultar diagnósticos, recomendaciones de riego y fumigación'}
                </Text>
              </View>
              <Icono name="chevron-forward" size={22} color="#0369A1" />
            </Pressable>
          </View>
        )}

        {/* ================================================================ */}
        {/* TRANSACCIONES (SUPERVISOR / ADMIN / AGRONOMO / OPERARIO)         */}
        {/* ================================================================ */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Icono name="git-branch-outline" size={20} color={colors.brown} />
            <Text style={styles.seccionTitulo}>Transacciones de Campo</Text>
          </View>
          <Text style={styles.seccionSub}>
            {puedeEditarMaestros
              ? 'Control de cosechas, asignaciones y labores en fundo'
              : 'Consulta de cosechas, asignaciones y labores · Solo lectura'}
          </Text>

          <View style={styles.grid}>
            {Object.values(TRANSACCIONES).map((t) => (
              <ModuloCard
                key={t.clave}
                iconName={t.icono.name}
                iconFamily={t.icono.family}
                titulo={t.titulo}
                subtitulo={puedeEditarMaestros ? `Módulo ${t.estudiante.split(' ')[0]}` : 'Solo consulta'}
                tono="tierra"
                onPress={() => router.push({ pathname: '/transaccion/[modulo]', params: { modulo: t.clave } })}
              />
            ))}
          </View>
        </View>

        {/* ================================================================ */}
        {/* MAESTROS (ADMIN / SUPERVISOR / AGRONOMO / OPERARIO)             */}
        {/* ================================================================ */}
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Icono name="layers-outline" size={20} color={colors.primary} />
            <Text style={styles.seccionTitulo}>Catálogos Maestros</Text>
          </View>
          <Text style={styles.seccionSub}>
            {puedeEditarMaestros
              ? 'Insumos de almacén, parcelas y colaboradores'
              : 'Consulta de parcelas y terrenos de cultivo · Solo lectura'}
          </Text>

          <View style={styles.grid}>
            {Object.values(MAESTROS).map((m) => {
              // Agrónomo y Operario consultan parcelas (y si supervisor/admin, todos)
              if (!puedeEditarMaestros && m.clave !== 'parcelas') return null;

              return (
                <ModuloCard
                  key={m.clave}
                  iconName={m.icono.name}
                  iconFamily={m.icono.family}
                  titulo={m.titulo}
                  subtitulo={
                    puedeEditarMaestros
                      ? m.clave === 'insumos'
                        ? 'Almacén'
                        : m.clave === 'parcelas'
                        ? 'Terrenos'
                        : 'Equipo'
                      : 'Solo consulta'
                  }
                  tono="verde"
                  onPress={() => router.push({ pathname: '/maestro/[modulo]', params: { modulo: m.clave } })}
                />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroFila: { flexDirection: 'row', alignItems: 'center' },
  saludo: { fontSize: 24, fontWeight: '900', color: colors.white },
  rolBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroSub: { color: colors.brownLight, fontWeight: '700', fontSize: 13 },
  salir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  salirTexto: { color: colors.white, fontWeight: '700', fontSize: 13 },
  seccion: { paddingHorizontal: 16, marginTop: 20 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seccionTitulo: { fontSize: 18, fontWeight: '800', color: colors.text },
  seccionSub: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modulo: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  moduloIcono: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduloTitulo: { fontSize: 14, fontWeight: '800', color: colors.text },
  moduloSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
  bannerOperario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    ...shadow,
  },
  bannerOperarioIcono: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerOperarioTitulo: { fontSize: 16, fontWeight: '800', color: colors.primaryDark },
  bannerOperarioSub: { fontSize: 12, color: '#388E3C', marginTop: 2, lineHeight: 16 },
  bannerFichas: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E0F2FE',
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...shadow,
  },
  bannerFichasIcono: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerFichasTitulo: { fontSize: 16, fontWeight: '800', color: '#0369A1' },
  bannerFichasSub: { fontSize: 12, color: '#0284C7', marginTop: 2, lineHeight: 16 },
});
