import { ANALYTICS_URL, API_URL } from '../config/env';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function solicitar<T>(baseUrl: string, path: string, options: RequestInit = {}): Promise<T> {
  const esArchivo = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        // Con FormData el navegador/RN pone el Content-Type con el boundary
        ...(esArchivo ? {} : { 'Content-Type': 'application/json' }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(`No se pudo conectar con el servidor (${baseUrl}). Revise la URL y su red.`, 0);
  }

  const text = await response.text();
  const body = text ? safeJson(text) : null;

  if (!response.ok) {
    const detalle = body?.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)
      ? ': ' + Object.values(body.errors).join(', ')
      : '';
    const message = (body?.message ?? body?.error ?? `Error ${response.status}`) + detalle;
    throw new ApiError(message, response.status);
  }
  return body as T;
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/** Cliente del Backend 1 (Spring Boot): agrega el token Bearer y traduce errores. */
export const api = <T>(path: string, options?: RequestInit) => solicitar<T>(API_URL, path, options);

/** Cliente del Backend 2 Analítico (Flask): las respuestas vienen como { success, data }. */
export const apiAnalitico = async <T>(path: string) =>
  (await solicitar<{ success: boolean; data: T }>(ANALYTICS_URL, path)).data;

/** URL directa para descargar archivos (exportar Excel / PDF). */
export const urlDescarga = (path: string) => `${API_URL}${path}`;
