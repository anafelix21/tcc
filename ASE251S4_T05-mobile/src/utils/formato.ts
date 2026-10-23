export const soles = (n: unknown) =>
  `S/ ${Number(n ?? 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const numero = (n: unknown, decimales = 2) =>
  Number(n ?? 0).toLocaleString('es-PE', { maximumFractionDigits: decimales });

export const kilos = (n: unknown) => `${numero(n)} kg`;

export const porcentaje = (n: unknown) => `${numero(n, 1)} %`;

export const texto = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));

export const siNo = (v: unknown) => (v ? 'Sí' : 'No');
