import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Ejecuta `cargar` cada vez que la pantalla recibe el foco (al volver de editar/registrar se refresca). */
export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, deps);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  return { datos, setDatos, cargando, error, recargar };
}
