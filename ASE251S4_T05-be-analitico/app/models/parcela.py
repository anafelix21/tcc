"""Maestro Parcela (MongoDB, colección `parcelas`)."""
from app.models.base import asegurar_columnas, a_numero, a_booleano, a_texto, produccion_a_kg

COLECCION = "parcelas"

CAMPOS = {
    "_id": "id",
    "nombre": "nombre",
    "ubicacion": "ubicacion",
    "area_hectareas": "area_hectareas",
    "tipo_suelo": "tipo_suelo",
    "responsable": "responsable",
    "estado_riego": "estado_riego",
    "produccion_estimada": "produccion_estimada",
    "cultivo_actual": "cultivo_actual",
    "en_uso": "en_uso",
    "estado": "estado",
}


def normalizar(df):
    df = asegurar_columnas(df, CAMPOS.keys())[list(CAMPOS.keys())].rename(columns=CAMPOS)
    df["area_hectareas"] = a_numero(df["area_hectareas"])
    df["produccion_estimada_kg"] = df["produccion_estimada"].apply(produccion_a_kg)
    df["en_uso"] = a_booleano(df["en_uso"], defecto=False)
    df["estado"] = a_booleano(df["estado"])
    for col in ("nombre", "tipo_suelo", "responsable", "estado_riego", "cultivo_actual", "ubicacion"):
        df[col] = a_texto(df[col])
    return df
