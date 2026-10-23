"""Cliente HTTP mínimo (solo librería estándar) usado por los scripts de prueba y siembra."""
import json
import os
import urllib.error
import urllib.request
import uuid

API = os.getenv("API_URL", "http://localhost:8081/api")
ANALYTICS = os.getenv("ANALYTICS_URL", "http://localhost:5000/api/v1/analytics")
ANALYTICS_ROOT = ANALYTICS.split("/api/")[0]
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://axelhuapaya_db_user:lider2021@cluster0.oyk6ogs.mongodb.net/?appName=Cluster0")
MONGO_DB = os.getenv("MONGO_DB_NAME", "agropacayales_db")
SQL = dict(server=os.getenv("SQL_SERVER", "localhost"), port=os.getenv("SQL_PORT", "1433"),
           user=os.getenv("SQL_USER", "sa"), password=os.getenv("SQL_PASSWORD", "AgroPacayales2026!"),
           database=os.getenv("SQL_DATABASE", "agropacayales_db"))

TOKEN = {"valor": None}


class Respuesta:
    def __init__(self, status, body, raw):
        self.status, self.body, self.raw = status, body, raw

    @property
    def ok(self):
        return 200 <= self.status < 300


def pedir(metodo, url, data=None, headers=None, archivo=None, timeout=30):
    headers = dict(headers or {})
    cuerpo = None
    if archivo:
        nombre, contenido, tipo = archivo
        limite = uuid.uuid4().hex
        cuerpo = (f"--{limite}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{nombre}\"\r\n"
                  f"Content-Type: {tipo}\r\n\r\n").encode() + contenido + f"\r\n--{limite}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={limite}"
    elif data is not None:
        cuerpo = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
    if TOKEN["valor"]:
        headers["Authorization"] = f"Bearer {TOKEN['valor']}"
    req = urllib.request.Request(url, data=cuerpo, method=metodo, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read()
            status = r.status
    except urllib.error.HTTPError as e:
        raw, status = e.read(), e.code
    except Exception as e:  # servidor caído
        return Respuesta(0, {"message": str(e)}, b"")
    try:
        body = json.loads(raw) if raw else None
    except ValueError:
        body = None
    return Respuesta(status, body, raw)


def api(metodo, ruta, data=None, **kw):
    return pedir(metodo, f"{API}{ruta}", data, **kw)


def analitico(ruta):
    return pedir("GET", f"{ANALYTICS}{ruta}")
