import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function RootLayout() {
  const stackContent = (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.earthDarkest },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
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
  );

  if (Platform.OS === 'web') {
    return (
      <AuthProvider>
        <StatusBar style="light" />
        <View style={styles.webOuter}>
          <View style={styles.webPhoneFrame}>
            {/* Top Speaker & Sensor Bezel */}
            <View style={styles.phoneHeaderBezel}>
              <View style={styles.phoneSpeaker} />
              <View style={styles.phoneCamera} />
            </View>
            <View style={styles.phoneContent}>
              {stackContent}
            </View>
            {/* Bottom Home Indicator Bar */}
            <View style={styles.phoneBottomBezel}>
              <View style={styles.homeIndicator} />
            </View>
          </View>
        </View>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {stackContent}
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as any,
    backgroundColor: '#1A110B', // Deep Earth Brown on lateral surroundings
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  webPhoneFrame: {
    width: '100%',
    maxWidth: 520,
    height: '96vh' as any,
    maxHeight: 960,
    backgroundColor: colors.background,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3D2A1F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  phoneHeaderBezel: {
    height: 24,
    backgroundColor: '#1A110B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A1E17',
  },
  phoneSpeaker: {
    width: 55,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3D2A1F',
  },
  phoneCamera: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2A1E17',
    borderWidth: 1,
    borderColor: '#543827',
  },
  phoneContent: {
    flex: 1,
    overflow: 'hidden',
  },
  phoneBottomBezel: {
    height: 18,
    backgroundColor: '#1A110B',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#2A1E17',
  },
  homeIndicator: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8C5A3C',
  },
});

