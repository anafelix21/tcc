import re
import pandas as pd


def asegurar_columnas(df, columnas):
    """Garantiza que existan todas las columnas (con None) aunque la colección esté vacía."""
    df = df.copy() if df is not None else pd.DataFrame()
    for col in columnas:
        if col not in df.columns:
            df[col] = None
    return df


def a_numero(serie, defecto=0.0):
    """Convierte a número (Spring guarda BigDecimal como texto en Mongo, p.ej. '85.5')."""
    return pd.to_numeric(serie, errors="coerce").fillna(defecto)


def a_booleano(serie, defecto=True):
    return serie.apply(lambda v: defecto if v is None or (isinstance(v, float) and pd.isna(v)) else bool(v))


def a_texto(serie, defecto="NO ESPECIFICADO"):
    return serie.apply(lambda v: defecto if v is None or (isinstance(v, float) and pd.isna(v)) or str(v).strip() == ""
                       else str(v).strip())


_NUM = re.compile(r"(\d+(?:[.,]\d+)?)")


def produccion_a_kg(valor):
    """'50 toneladas' -> 50000.0 ; '1200 kg' -> 1200.0 ; '30' -> 30.0"""
    if valor is None or (isinstance(valor, float) and pd.isna(valor)):
        return 0.0
    texto = str(valor).lower()
    m = _NUM.search(texto)
    if not m:
        return 0.0
    numero = float(m.group(1).replace(",", "."))
    if "ton" in texto or re.search(r"\bt\b", texto):
        return numero * 1000
    return numero
