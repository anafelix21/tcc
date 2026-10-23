"""Eventos de negocio / logs de actividad (MongoDB, colección `eventos_negocio`).

Los envía el Backend 1 (Spring Boot) cada vez que registra, actualiza, elimina, restaura
o importa datos. El Backend Analítico los ingesta y los procesa con Pandas.
"""
import pandas as pd
from app.models.base import asegurar_columnas, a_texto

COLECCION = "eventos_negocio"

CAMPOS = ["_id", "tipo_evento", "entidad", "entidad_id", "origen", "usuario", "detalle", "fecha_evento"]


def normalizar(df):
    df = asegurar_columnas(df, CAMPOS)[CAMPOS].rename(columns={"_id": "id"})
    df["tipo_evento"] = a_texto(df["tipo_evento"]).str.upper()
    df["entidad"] = a_texto(df["entidad"]).str.upper()
    df["origen"] = a_texto(df["origen"])
    df["fecha_evento"] = pd.to_datetime(df["fecha_evento"], errors="coerce")
    return df
