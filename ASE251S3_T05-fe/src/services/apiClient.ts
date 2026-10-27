/**
 * Cliente HTTP unificado para AgroPacayales
 * - Conecta con Backend 1 (/api) y Backend 2 (/api/v1/analytics)
 * - Timeout controlado de 2500ms para evitar cuelgues o cargas lentas
 */

const API_BASE = '/api';
const ANALYTICS_BASE = '/api/v1/analytics';

export async function request<T>(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 15000
): Promise<T> {
  const token = localStorage.getItem('agro_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s): El servidor no responde.`));
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errJson.error || errorMsg;
      } catch {
        // response might not be json
      }
      console.error(`[API Client Error] ${options.method || 'GET'} ${url} ->`, errorMsg);
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      throw new Error(`Tiempo de espera agotado (${Math.round(timeoutMs / 1000)}s): No se pudo conectar con el backend.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>(`${API_BASE}${endpoint}`),
  post: <T>(endpoint: string, body: any) =>
    request<T>(`${API_BASE}${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  put: <T>(endpoint: string, body: any) =>
    request<T>(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  patch: <T>(endpoint: string, body?: any) =>
    request<T>(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    request<T>(`${API_BASE}${endpoint}`, { method: 'DELETE' }),

  // Analytics endpoints
  getAnalytics: <T>(endpoint: string) =>
    request<T>(`${ANALYTICS_BASE}${endpoint}`),
};
