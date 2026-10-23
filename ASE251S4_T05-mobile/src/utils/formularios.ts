import { Campo, FormValores, Registro } from '../modules/types';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Valida los valores del formulario según la definición de cada campo. */
export function validar(campos: Campo[], valores: FormValores, esEdicion: boolean): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const c of campos) {
    const v = (valores[c.key] ?? '').trim();
    const obligatorio = c.requerido || (c.requeridoAlCrear && !esEdicion);
    if (!v) {
      if (obligatorio && c.tipo !== 'booleano') errores[c.key] = `${c.label} es obligatorio`;
      continue;
    }
    if (c.maxLength && v.length > c.maxLength) errores[c.key] = `Máximo ${c.maxLength} caracteres`;
    if (c.tipo === 'email' && !EMAIL.test(v)) errores[c.key] = 'Correo no válido';
    if (c.tipo === 'fecha' && (!FECHA.test(v) || Number.isNaN(Date.parse(v)))) errores[c.key] = 'Use el formato AAAA-MM-DD';
    if (c.tipo === 'entero' || c.tipo === 'decimal') {
      const n = Number(v.replace(',', '.'));
      if (Number.isNaN(n)) errores[c.key] = 'Ingrese un número válido';
      else if (c.tipo === 'entero' && !Number.isInteger(n)) errores[c.key] = 'Ingrese un número entero';
      else if (c.min !== undefined && n < c.min) errores[c.key] = `Debe ser mayor o igual a ${c.min}`;
      else if (c.max !== undefined && n > c.max) errores[c.key] = `Debe ser menor o igual a ${c.max}`;
    }
  }
  return errores;
}

/** Claves con punto ("sistemaRiego.tipo") representan subdocumentos embebidos de MongoDB. */
function asignar(obj: Registro, ruta: string, valor: unknown) {
  const partes = ruta.split('.');
  let actual = obj;
  partes.slice(0, -1).forEach((p) => { actual = actual[p] ??= {}; });
  actual[partes[partes.length - 1]] = valor;
}

function leer(obj: Registro, ruta: string) {
  return ruta.split('.').reduce<any>((v, p) => (v == null ? undefined : v[p]), obj);
}

/** Convierte los textos del formulario al JSON que espera el backend. */
export function aPayload(campos: Campo[], valores: FormValores): Registro {
  const payload: Registro = {};
  for (const c of campos) {
    const v = (valores[c.key] ?? '').trim();
    if (c.tipo === 'booleano') {
      asignar(payload, c.key, v === 'true');
      continue;
    }
    if (!v) continue;
    if (c.tipo === 'entero') asignar(payload, c.key, parseInt(v, 10));
    else if (c.tipo === 'decimal') asignar(payload, c.key, Number(v.replace(',', '.')));
    else asignar(payload, c.key, v);
  }
  return payload;
}

/** Convierte un registro del backend a valores de texto para el formulario. */
export function aValores(campos: Campo[], registro: Registro): FormValores {
  const valores: FormValores = {};
  for (const c of campos) {
    const v = leer(registro, c.key);
    if (c.tipo === 'password') valores[c.key] = '';
    else valores[c.key] = v === undefined || v === null ? '' : String(v);
  }
  return valores;
}

export function valoresVacios(campos: Campo[]): FormValores {
  return Object.fromEntries(campos.map((c) => [c.key, c.tipo === 'booleano' ? 'false' : '']));
}
