import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="inicio" options={{ headerShown: false }} />
        <Stack.Screen name="fichas-campo/index" options={{ title: 'Fichas de Campo' }} />
        <Stack.Screen name="fichas-campo/[id]" options={{ title: 'Detalle de Ficha' }} />
        <Stack.Screen name="fichas-campo/formulario" options={{ title: 'Ficha de Campo' }} />
        <Stack.Screen name="mis-labores/index" options={{ title: 'Mis Labores de Campo' }} />
      </Stack>
    </AuthProvider>
  );
}
