import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; analyticsUrl?: string };

/**
 * URL del Backend 1 (Spring Boot) y del Backend 2 Analítico (Flask). Prioridad:
 * 1. Variables EXPO_PUBLIC_API_URL / EXPO_PUBLIC_ANALYTICS_URL (archivo .env)
 * 2. app.json -> expo.extra
 * En un celular físico use la IP de su PC o la URL de AWS, nunca "localhost".
 */
export const API_URL: string = process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:8081/api';

export const ANALYTICS_URL: string =
  process.env.EXPO_PUBLIC_ANALYTICS_URL ?? extra.analyticsUrl ?? 'http://localhost:5000/api/v1/analytics';
