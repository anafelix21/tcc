import math
import numpy as np
import pandas as pd


def _limpiar(valor):
    if isinstance(valor, (np.integer,)):
        return int(valor)
    if isinstance(valor, (np.floating, float)):
        return 0.0 if math.isnan(valor) or math.isinf(valor) else round(float(valor), 2)
    if isinstance(valor, (np.bool_,)):
        return bool(valor)
    if isinstance(valor, (pd.Timestamp,)):
        return valor.isoformat()
    if valor is None or (not isinstance(valor, (str, list, dict)) and pd.isna(valor)):
        return None
    return valor


def registros(df):
    """DataFrame -> lista de dicts lista para JSON (sin NaN ni tipos numpy)."""
    if df is None or df.empty:
        return []
    return [{k: _limpiar(v) for k, v in fila.items()} for fila in df.to_dict(orient="records")]


def numero(valor):
    return _limpiar(valor) or 0


def porcentaje(parte, total):
    return round(float(parte) / float(total) * 100, 2) if total else 0.0


def numerico(df, columnas):
    """Convierte columnas a float (DECIMAL de SQL Server llega como Decimal)."""
    for col in columnas:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype(float)
    return df
