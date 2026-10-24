import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { CampoTexto } from '../components/CampoTexto';
import { Boton } from '../components/Boton';
import { Icono } from '../components/Icono';
import { colors, radius, shadow } from '../theme/colors';
import { API_URL } from '../config/env';

export default function LoginScreen() {
  const { iniciarSesion } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ingresar = async () => {
    if (!correo.trim() || !password) {
      setError('Ingrese correo y contraseña');
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await iniciarSesion(correo, password);
      router.replace('/inicio');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Icono name="leaf" size={42} color={colors.primary} />
            </View>
            <Text style={styles.marca}>AgroPacayales</Text>
            <Text style={styles.lema}>Gestión agrícola inteligente</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.bienvenida}>Bienvenido</Text>
            <Text style={styles.instruccion}>Inicie sesión para gestionar el campo</Text>
            <CampoTexto etiqueta="Correo" value={correo} onChangeText={setCorreo} autoCapitalize="none"
              keyboardType="email-address" placeholder="usuario@agro.com" autoComplete="email" />
            <CampoTexto etiqueta="Contraseña" value={password} onChangeText={setPassword} secureTextEntry
              placeholder="••••••" onSubmitEditing={ingresar} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Boton titulo="Iniciar sesión" onPress={ingresar} cargando={cargando} />
            <View style={{ height: 10 }} />
            <Boton titulo="Continuar como invitado" variante="tierra" onPress={() => router.replace('/inicio')} />
          </View>
          <Text style={styles.api}>API: {API_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colors.primaryDark },
  contenido: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.brownSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: colors.brownLight },
  marca: { fontSize: 30, fontWeight: '900', color: colors.white, letterSpacing: 0.5 },
  lema: { color: colors.brownLight, marginTop: 4, fontWeight: '600' },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 22, width: '100%', maxWidth: 440, alignSelf: 'center', ...shadow },
  bienvenida: { fontSize: 22, fontWeight: '800', color: colors.text },
  instruccion: { color: colors.muted, marginTop: 2, marginBottom: 18 },
  error: { color: colors.danger, backgroundColor: colors.dangerSoft, padding: 10, borderRadius: radius.sm, marginBottom: 12 },
  api: { color: '#A5C8A7', fontSize: 11, textAlign: 'center', marginTop: 16 },
});
