"""Maestro Usuario (MongoDB, colección `usuarios`). Nunca se lee el campo password."""
from app.models.base import asegurar_columnas, a_booleano, a_texto

COLECCION = "usuarios"
PROYECCION = {"password": 0}

CAMPOS = {
    "_id": "id",
    "nombre": "nombre",
    "apellido": "apellido",
    "correo": "correo",
    "rol": "rol",
    "estado": "estado",
}


def normalizar(df):
    df = asegurar_columnas(df, CAMPOS.keys())[list(CAMPOS.keys())].rename(columns=CAMPOS)
    df["estado"] = a_booleano(df["estado"])
    df["rol"] = a_texto(df["rol"]).str.upper()
    df["nombre_completo"] = (a_texto(df["nombre"], "") + " " + a_texto(df["apellido"], "")).str.strip()
    return df
