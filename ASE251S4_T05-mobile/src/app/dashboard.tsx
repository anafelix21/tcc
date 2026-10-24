import { Redirect } from 'expo-router';

/**
 * La vista analítica gerencial se gestiona exclusivamente desde la Web (ASE251S3_T05-fe).
 * El aplicativo móvil está orientado a la operación en campo (Fichas de Campo, Labores de Operario, Registros).
 */
export default function DashboardScreen() {
  return <Redirect href="/inicio" />;
}
