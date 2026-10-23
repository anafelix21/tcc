"""Siembra datos de demostración ENLAZADOS entre MongoDB y SQL Server.

- Parcelas (MongoDB) desde ASE251S4_T05-be/csv/parcelas.csv si no hay ninguna.
- Cultivos (SQL Server) apuntando a parcelas reales (_id de MongoDB).
- Actividades, asignaciones y cosechas creadas a través de la API del Backend 1
  usando insumos y usuarios reales -> los indicadores cruzados SQL + Mongo tienen datos.

Es idempotente: si ya existen datos [demo] no los vuelve a crear.
Uso (con el Backend 1 corriendo):  python scripts/sembrar_demo.py
"""
import csv
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from _http import SQL, api  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parents[1]
MARCA = "[demo]"


def paso(msg):
    print(f"  • {msg}")


def sembrar_parcelas():
    activas = api("GET", "/parcelas/estado/true").body or []
    if len(activas) >= 5:
        paso(f"Parcelas: ya existen {len(activas)}")
        return activas
    with open(RAIZ / "ASE251S4_T05-be/csv/parcelas.csv", encoding="utf-8") as f:
        for fila in csv.DictReader(f):
            fila["areaHectareas"] = float(fila["areaHectareas"])
            fila["enUso"] = True
            r = api("POST", "/parcelas", {k: v for k, v in fila.items() if v != ""})
            if not r.ok:
                paso(f"Parcela '{fila['nombre']}' no creada: {(r.body or {}).get('message')}")
    activas = api("GET", "/parcelas/estado/true").body or []
    paso(f"Parcelas activas: {len(activas)}")
    return activas


def sembrar_cultivos(parcelas):
    import pymssql
    ids = {p["id"] for p in parcelas}
    cultivos = [("Palta Hass Exportación", "Frutal Perenne"), ("Arándano Biloxi", "Arbusto Frutal"),
                ("Espárrago UC-157", "Hortaliza"), ("Maíz Amarillo Duro", "Cereal")]
    with pymssql.connect(**SQL) as conn, conn.cursor() as cur:
        cur.execute("SELECT id_parcela FROM dbo.cultivos WHERE estado = 1")
        enlazados = [r[0] for r in cur.fetchall() if r[0] in ids]
        if len(enlazados) >= len(cultivos):
            paso(f"Cultivos enlazados a parcelas reales: ya existen {len(enlazados)}")
            return
        if not parcelas:
            paso("Sin parcelas en MongoDB: no se crean cultivos enlazados")
            return
        for (nombre, tipo), parcela in zip(cultivos, parcelas):
            cur.execute("""INSERT INTO dbo.cultivos (id_parcela, nombre, tipo_cultivo, frecuencia_riego_dias,
                           temperatura_ideal, fecha_siembra, requiere_sombra, observaciones, estado)
                           VALUES (%s, %s, %s, 3, 21.5, '2026-03-01', 0, %s, 1)""",
                        (parcela["id"], nombre, tipo, f"{MARCA} enlazado a {parcela['nombre']}"))
        conn.commit()
    paso(f"Cultivos creados y enlazados a {min(len(cultivos), len(parcelas))} parcelas de MongoDB")


def sembrar_transacciones():
    actividades = api("GET", "/actividades-cultivos").body or []
    if any(MARCA in (a.get("descripcion") or "") for a in actividades):
        paso("Transacciones demo: ya existen")
        return
    cultivos = api("GET", "/cultivos").body or []
    # Preferir los cultivos enlazados a parcelas reales de MongoDB
    cultivos = [c for c in cultivos if MARCA in (c.get("observaciones") or "")] or cultivos
    insumos = (api("GET", "/insumos/estado/true").body or [])[:6]
    usuarios = (api("GET", "/usuarios/estado/true").body or [])[:6]
    if not (cultivos and insumos and usuarios):
        paso("Faltan cultivos, insumos o usuarios; no se crean transacciones")
        return

    tipos = ["Fumigación", "Riego", "Fertilización", "Poda", "Control Fitosanitario"]
    creadas = []
    for i, tipo in enumerate(tipos):
        c = cultivos[i % len(cultivos)]
        detalles = [{"idInsumo": insumos[i % len(insumos)]["id"], "cantidad": 3 + i},
                    {"idInsumo": insumos[(i + 2) % len(insumos)]["id"], "cantidad": 2}]
        r = api("POST", "/actividades-cultivos", {"idCultivo": c["idCultivo"], "tipoActividad": tipo,
                                                   "descripcion": f"{MARCA} {tipo} en {c['nombre']}", "detalles": detalles})
        if r.ok:
            creadas.append(r.body["idActividad"])
        else:
            paso(f"Actividad no creada: {(r.body or {}).get('message')}")
    paso(f"Actividades creadas: {len(creadas)}")

    # Marcar algunas como completadas (no hay endpoint para ello)
    if creadas:
        import pymssql
        with pymssql.connect(**SQL) as conn, conn.cursor() as cur:
            cur.execute(f"UPDATE dbo.actividad_cultivo SET completado = 1 WHERE id_actividad IN ({','.join(map(str, creadas[:3]))})")
            conn.commit()

    n = 0
    for i, id_act in enumerate(creadas):
        trabajadores = [{"idUsuario": usuarios[(i + k) % len(usuarios)]["id"], "costoManoObra": 60 + 10 * k} for k in range(2)]
        r = api("POST", "/asignaciones-trabajadores", {"idActividad": id_act, "horasTrabajadas": 6 + i,
                                                        "observacion": f"{MARCA} jornada {i + 1}", "detalles": trabajadores})
        n += r.ok
    paso(f"Asignaciones creadas: {n}")

    n = 0
    for i, mes in enumerate(["2026-06-15", "2026-07-20", "2026-08-18", "2026-09-22", "2026-10-10"]):
        detalles = [{"idCultivo": cultivos[(i + k) % len(cultivos)]["idCultivo"], "kilosOptimos": 1800 + 350 * i + 200 * k,
                     "kilosMerma": 90 + 25 * i + 10 * k} for k in range(2)]
        responsable = ["Ana Félix", "Hugo Fernández", "Axel Huapaya"][i % 3]
        r = api("POST", "/harvest", {"responsable": responsable, "fechaCosecha": mes, "detalles": detalles})
        n += r.ok
    paso(f"Cosechas creadas: {n}")


if __name__ == "__main__":
    print("Sembrando datos de demostración...")
    if api("GET", "/insumos").status == 0:
        sys.exit("✗ El Backend 1 no responde en " + __import__("_http").API)
    sembrar_cultivos(sembrar_parcelas())
    sembrar_transacciones()
    print("Listo ✔")
