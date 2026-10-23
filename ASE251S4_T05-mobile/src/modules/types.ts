export type TipoCampo =
  | 'texto' | 'multilinea' | 'entero' | 'decimal' | 'email' | 'password' | 'fecha' | 'opciones' | 'booleano' | 'seleccion';

/** Catálogos que se cargan desde la API para los campos de tipo "seleccion". */
export type Fuente = 'cultivos' | 'insumos' | 'usuarios' | 'actividades';

export type Campo = {
  key: string;
  label: string;
  tipo: TipoCampo;
  requerido?: boolean;
  /** Obligatorio solo al registrar (p. ej. contraseña). */
  requeridoAlCrear?: boolean;
  opciones?: readonly string[];
  fuente?: Fuente;
  placeholder?: string;
  min?: number;
  max?: number;
  maxLength?: number;
};

export type Registro = Record<string, any>;
export type FormValores = Record<string, string>;

export type Resumen = { titulo: string; subtitulo?: string; detalle?: string; insignia?: string; valor?: string };

/** Maestros en MongoDB: insumos, parcelas, usuarios. */
export type ModuloMaestro = {
  clave: 'insumos' | 'parcelas' | 'usuarios';
  titulo: string;
  singular: string;
  icono: string;
  endpoint: string;
  campos: Campo[];
  resumen: (r: Registro) => Resumen;
  filas: (r: Registro) => [string, unknown][];
  notaEliminar?: string;
};

/** Transacciones cabecera-detalle en SQL Server: cosechas, actividades, asignaciones. */
export type ModuloTransaccion = {
  clave: 'cosechas' | 'actividades' | 'asignaciones';
  titulo: string;
  singular: string;
  icono: string;
  estudiante: string;
  endpoint: string;
  idKey: string;
  /** Cómo listar por estado (las cosechas no tienen /estado/{estado}). */
  listarPorEstado: (activos: boolean) => string | null;
  rutaEliminar: (id: string) => { path: string; method: 'PATCH' | 'PUT' };
  rutaRestaurar: (id: string) => { path: string; method: 'PATCH' | 'PUT' };
  cabecera: Campo[];
  detalle: { titulo: string; campos: Campo[] };
  aFormulario: (r: Registro) => { cabecera: FormValores; detalles: FormValores[] };
  resumen: (r: Registro) => Resumen;
  filas: (r: Registro) => [string, unknown][];
  /** `etiqueta` traduce el id del catálogo del detalle (p. ej. idCultivo) a su nombre. */
  filasDetalle: (d: Registro, etiqueta: (id: unknown) => string | undefined) => { titulo: string; subtitulo: string; valor?: string };
};
