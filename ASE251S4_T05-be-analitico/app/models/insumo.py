"""Maestro Insumo (MongoDB, colección `insumos`)."""
from app.models.base import asegurar_columnas, a_numero, a_booleano, a_texto

COLECCION = "insumos"

# Nombre del campo en Mongo (@Field de Spring) -> nombre usado en la analítica
CAMPOS = {
    "_id": "id",
    "nombre": "nombre",
    "precio": "precio",
    "stock": "stock",
    "unidad_medida": "unidad_medida",
    "tipo_insumo": "tipo_insumo",
    "proveedor": "proveedor",
    "presentacion": "presentacion",
    "estado": "estado",
    "created_at": "created_at",
}


def normalizar(df):
    df = asegurar_columnas(df, CAMPOS.keys())[list(CAMPOS.keys())].rename(columns=CAMPOS)
    df["precio"] = a_numero(df["precio"])
    df["stock"] = a_numero(df["stock"]).astype(int)
    df["estado"] = a_booleano(df["estado"])
    for col in ("nombre", "tipo_insumo", "proveedor", "unidad_medida", "presentacion"):
        df[col] = a_texto(df[col])
    df["tipo_insumo"] = df["tipo_insumo"].str.upper()
    df["valor_inventario"] = (df["precio"] * df["stock"]).round(2)
    return df
