import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { MAESTROS } from '../modules/maestros';
import { TRANSACCIONES } from '../modules/transacciones';
import { colors, radius, shadow } from '../theme/colors';

function Modulo({ icono, titulo, subtitulo, onPress, tono }: { icono: string; titulo: string; subtitulo: string; onPress: () => void; tono: 'verde' | 'tierra' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={titulo} onPress={onPress}
      style={({ pressed }) => [styles.modulo, pressed && { transform: [{ scale: 0.98 }] }]}>
      <View style={[styles.moduloIcono, { backgroundColor: tono === 'verde' ? colors.primarySoft : colors.brownSoft }]}>
        <Text style={{ fontSize: 26 }}>{icono}</Text>
      </View>
      <Text style={styles.moduloTitulo} numberOfLines={2}>{titulo}</Text>
      <Text style={styles.moduloSub} numberOfLines={2}>{subtitulo}</Text>
    </Pressable>
  );
}

export default function InicioScreen() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.primary }} edges={['top']}>
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.hero}>
          <View style={styles.heroFila}>
            <View style={{ flex: 1 }}>
              <Text style={styles.saludo}>Hola{usuario ? `, ${usuario.nombre}` : ''} 👋</Text>
              <Text style={styles.heroSub}>{usuario ? `Rol: ${usuario.rol}` : 'Modo invitado'}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => { cerrarSesion(); router.replace('/'); }} style={styles.salir}>
              <Text style={styles.salirTexto}>{usuario ? 'Salir' : 'Ingresar'}</Text>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Dashboard analítico" onPress={() => router.push('/dashboard')} style={styles.banner}>
            <Text style={{ fontSize: 28 }}>📊</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitulo}>Dashboard analítico</Text>
              <Text style={styles.bannerSub}>Indicadores de cosechas, campo y personal</Text>
            </View>
            <Text style={styles.bannerFlecha}>›</Text>
          </Pressable>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Maestros</Text>
          <Text style={styles.seccionSub}>MongoDB · registrar, editar, eliminar, restaurar, importar y exportar</Text>
          <View style={styles.grid}>
            {Object.values(MAESTROS).map((m) => (
              <Modulo key={m.clave} icono={m.icono} titulo={m.titulo} subtitulo="Catálogo" tono="verde"
                onPress={() => router.push({ pathname: '/maestro/[modulo]', params: { modulo: m.clave } })} />
            ))}
          </View>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Transacciones</Text>
          <Text style={styles.seccionSub}>SQL Server · cabecera y detalle enlazados con los maestros</Text>
          <View style={styles.grid}>
            {Object.values(TRANSACCIONES).map((t) => (
              <Modulo key={t.clave} icono={t.icono} titulo={t.titulo} subtitulo={t.estudiante} tono="tierra"
                onPress={() => router.push({ pathname: '/transaccion/[modulo]', params: { modulo: t.clave } })} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, borderBottomLeftRadius: radius.xl, borderBottomRightRadius: radius.xl },
  heroFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  saludo: { fontSize: 24, fontWeight: '900', color: colors.white },
  heroSub: { color: colors.brownLight, marginTop: 2, fontWeight: '600' },
  salir: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  salirTexto: { color: colors.white, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.brownSoft, borderRadius: radius.lg, padding: 16 },
  bannerTitulo: { fontSize: 16, fontWeight: '800', color: '#5D4027' },
  bannerSub: { fontSize: 12, color: '#7D6249', marginTop: 2 },
  bannerFlecha: { fontSize: 28, color: colors.brown, fontWeight: '300' },
  seccion: { paddingHorizontal: 16, marginTop: 22 },
  seccionTitulo: { fontSize: 19, fontWeight: '900', color: colors.text },
  seccionSub: { fontSize: 12, color: colors.muted, marginTop: 2, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modulo: { flexBasis: '30%', flexGrow: 1, minWidth: 100, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow },
  moduloIcono: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  moduloTitulo: { fontSize: 14, fontWeight: '800', color: colors.text },
  moduloSub: { fontSize: 11, color: colors.muted, marginTop: 2 },
});
