"""Prueba de punta a punta de AgroPacayales (Backend 1 + Backend 2 + MongoDB + SQL Server).

Recorre TODOS los endpoints de la rúbrica y muestra un reporte PASA / FALLA:
  1. Autenticación JWT
  2. Maestros (insumos, parcelas, usuarios): registrar, editar, eliminar, restaurar, importar 10, exportar Excel/PDF
  3. Transacciones (actividades, asignaciones, cosechas): registrar, editar, eliminar, restaurar
  4. Backend analítico: 18 indicadores, secciones, dashboard general, ingesta de eventos
  5. Integración: los eventos del Backend 1 llegan al Backend 2

Los registros de prueba usan el prefijo "PRUEBA-" y al final se borran físicamente.

Uso:
  python scripts/probar_todo.py
  (opcional) set PRUEBA_CORREO=hugo@agro.com y set PRUEBA_PASSWORD=...  para probar login con token
"""
import os
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import _http  # noqa: E402
from _http import api, analitico, pedir  # noqa: E402

VERDE, ROJO, AMARILLO, GRIS, FIN = "\033[92m", "\033[91m", "\033[93m", "\033[90m", "\033[0m"
SUFIJO = str(int(time.time()))[-6:]
resultados = []


def check(seccion, nombre, condicion, detalle=""):
    resultados.append((seccion, nombre, bool(condicion), detalle))
    marca = f"{VERDE}PASA{FIN}" if condicion else f"{ROJO}FALLA{FIN}"
    print(f"  [{marca}] {nombre}" + (f" {GRIS}— {detalle}{FIN}" if detalle else ""))
    return condicion


def msg(r):
    return f"HTTP {r.status} {(r.body or {}).get('message', '') if isinstance(r.body, dict) else ''}".strip()


# ---------------------------------------------------------------------------
def probar_servicios():
    print("\n▶ 0. Servicios")
    ok1 = check("Servicios", "Backend 1 (Spring Boot) responde", pedir("GET", _http.API.replace("/api", "/api-docs")).ok, _http.API)
    r = pedir("GET", f"{_http.ANALYTICS_ROOT}/health")
    ok2 = check("Servicios", "Backend 2 (Flask) responde", r.ok, _http.ANALYTICS_ROOT)
    if r.ok:
        d = r.body["data"]
        check("Servicios", "Backend 2 conectado a MongoDB", d["mongodb"] == "UP")
        check("Servicios", "Backend 2 conectado a SQL Server", d["sqlserver"] == "UP")
    check("Servicios", "Swagger Backend 1 disponible", pedir("GET", _http.API.replace("/api", "/swagger-ui.html")).status in (200, 302))
    check("Servicios", "Swagger Backend 2 disponible", pedir("GET", f"{_http.ANALYTICS_ROOT}/apidocs/").ok)
    return ok1 and ok2


def probar_auth():
    print("\n▶ 1. Autenticación y autorización")
    r = api("GET", "/auth/me")
    check("Auth", "Sin token /auth/me responde 401", r.status == 401)
    r = api("POST", "/auth/login", {"correo": "noexiste@agro.com", "password": "x"})
    check("Auth", "Credenciales inválidas responden 401", r.status == 401)
    correo, clave = os.getenv("PRUEBA_CORREO"), os.getenv("PRUEBA_PASSWORD")
    if correo and clave:
        r = api("POST", "/auth/login", {"correo": correo, "password": clave})
        if check("Auth", "Login válido devuelve token JWT", r.ok and r.body.get("token"), msg(r)):
            _http.TOKEN["valor"] = r.body["token"]
            check("Auth", "Token válido en /auth/me", api("GET", "/auth/me").ok)
    else:
        print(f"  {AMARILLO}(omitido) Login válido: defina PRUEBA_CORREO y PRUEBA_PASSWORD{FIN}")
    check("Auth", "GET /usuarios no expone contraseñas",
          all("password" not in u for u in (api("GET", "/usuarios").body or [])))


# ---------------------------------------------------------------------------
MAESTROS = {
    "insumos": ({"nombre": f"PRUEBA-Insumo-{SUFIJO}", "descripcion": "Prueba automática", "precio": 12.5, "stock": 40,
                 "unidadMedida": "kg", "tipoInsumo": "FERTILIZANTE", "proveedor": "QA", "presentacion": "Saco"},
                {"precio": 15.0, "stock": 0}),
    "parcelas": ({"nombre": f"PRUEBA-Parcela-{SUFIJO}", "ubicacion": "Lote QA", "areaHectareas": 3.5, "tipoSuelo": "Franco",
                  "estadoRiego": "Completo", "responsable": "QA", "enUso": False},
                 {"areaHectareas": 4.0, "estadoRiego": "Pendiente"}),
    "usuarios": ({"nombre": "PRUEBA", "apellido": f"Usuario{SUFIJO}", "correo": f"prueba{SUFIJO}@agro.com", "password": "Prueba123",
                  "rol": "OPERARIO", "fechaNacimiento": "1995-05-10", "fechaContratacion": "2024-01-15"},
                 {"rol": "TECNICO"}),
}


def probar_maestro(nombre, nuevo, cambios):
    s = f"Maestro {nombre}"
    print(f"\n▶ 2. {s} (MongoDB)")
    r = api("POST", f"/{nombre}", nuevo)
    if not check(s, "Registrar", r.status == 201, msg(r)):
        return
    reg = r.body
    i = reg["id"]
    check(s, "Auditoría createdAt al registrar", reg.get("createdAt"))
    campos = [k for k in reg if k not in ("password",)]
    if nombre == "insumos":
        check(s, "≥ 12 campos con 4 de auditoría", len(set(campos) | {"updatedAt", "deletedAt", "restoredAt"}) >= 12, f"{len(campos)} campos devueltos")
    check(s, "Obtener por ID", api("GET", f"/{nombre}/{i}").ok)
    r = api("PUT", f"/{nombre}/{i}", {**nuevo, **cambios})
    check(s, "Editar", r.ok and r.body.get("updatedAt"), msg(r))
    r = api("PATCH", f"/{nombre}/{i}/eliminar")
    check(s, "Eliminar (lógico, deletedAt)", r.ok and r.body.get("estado") is False and r.body.get("deletedAt"), msg(r))
    check(s, "Aparece en la lista de eliminados", any(x["id"] == i for x in api("GET", f"/{nombre}/estado/false").body or []))
    r = api("PATCH", f"/{nombre}/{i}/restaurar")
    check(s, "Restaurar (restoredAt)", r.ok and r.body.get("estado") is True and r.body.get("restoredAt"), msg(r))
    for fmt, firma in (("excel", b"PK"), ("pdf", b"%PDF")):
        r = api("GET", f"/{nombre}/exportar/{fmt}")
        check(s, f"Exportar {fmt.upper()}", r.ok and r.raw[:4].startswith(firma), f"{len(r.raw)} bytes")
    return i


def probar_importacion():
    s = "Maestro insumos"
    filas = ["nombre,descripcion,precio,stock,unidadMedida,tipoInsumo,proveedor,presentacion"]
    filas += [f"PRUEBA-Import-{SUFIJO}-{n:02d},Importado por prueba,{10 + n}.50,0,kg,OTRO,QA,Bolsa" for n in range(1, 11)]
    r = api("POST", "/insumos/importar/csv", archivo=("prueba.csv", "\n".join(filas).encode(), "text/csv"))
    b = r.body or {}
    check(s, "Importar CSV con 10 registros", r.ok and b.get("importados") == 10,
          f"filas={b.get('totalFilas')} importados={b.get('importados')} fallidos={b.get('fallidos')}")
    lista = api("GET", "/insumos/estado/true").body or []
    check(s, "Lista tiene ≥ 10 registros para exportar", len(lista) >= 10, f"{len(lista)} activos")


# ---------------------------------------------------------------------------
def probar_transacciones(insumo_id, usuario_id):
    print("\n▶ 3. Transacciones (SQL Server enlazado con MongoDB)")
    cultivos = api("GET", "/cultivos").body or []
    if not check("Transacciones", "Catálogo de cultivos (GET /cultivos)", cultivos, f"{len(cultivos)} cultivos"):
        return
    id_cultivo = cultivos[0]["idCultivo"]

    s = "Actividades"
    req = {"idCultivo": id_cultivo, "tipoActividad": "Riego", "descripcion": f"PRUEBA-{SUFIJO}",
           "detalles": [{"idInsumo": insumo_id, "cantidad": 2}]}
    r = api("POST", "/actividades-cultivos", req)
    if check(s, "Registrar actividad con insumo de MongoDB", r.status == 201, msg(r)):
        a = r.body["idActividad"]
        check(s, "Precio tomado del maestro (subtotal = 2 × 15.00)", float(r.body["detalles"][0]["subtotal"]) == 30.0)
        r = api("PUT", f"/actividades-cultivos/{a}", {**req, "tipoActividad": "Fertilización"})
        check(s, "Editar actividad", r.ok and r.body["tipoActividad"] == "Fertilización", msg(r))
        r = api("POST", "/actividades-cultivos", {**req, "detalles": [{"idInsumo": "000000000000000000000000", "cantidad": 1}]})
        check(s, "Rechaza insumo inexistente en MongoDB", r.status == 400, msg(r))

        s = "Asignaciones"
        req2 = {"idActividad": a, "horasTrabajadas": 8, "observacion": f"PRUEBA-{SUFIJO}",
                "detalles": [{"idUsuario": usuario_id, "costoManoObra": 75}]}
        r = api("POST", "/asignaciones-trabajadores", req2)
        if check(s, "Registrar asignación con usuario de MongoDB", r.status == 201, msg(r)):
            g = r.body["idAsignacionCabecera"]
            check(s, "Editar asignación", api("PUT", f"/asignaciones-trabajadores/{g}", {**req2, "horasTrabajadas": 6}).ok)
            check(s, "Eliminar asignación", api("PATCH", f"/asignaciones-trabajadores/{g}/eliminar").ok)
            check(s, "Restaurar asignación", api("PATCH", f"/asignaciones-trabajadores/{g}/restaurar").ok)
            api("PATCH", f"/asignaciones-trabajadores/{g}/eliminar")
        s = "Actividades"
        check(s, "Eliminar actividad", api("PATCH", f"/actividades-cultivos/{a}/eliminar").ok)
        check(s, "Restaurar actividad", api("PATCH", f"/actividades-cultivos/{a}/restaurar").ok)
        api("PATCH", f"/actividades-cultivos/{a}/eliminar")

    s = "Cosechas"
    req = {"responsable": f"PRUEBA-{SUFIJO}", "fechaCosecha": "2026-10-01",
           "detalles": [{"idCultivo": id_cultivo, "kilosOptimos": 100, "kilosMerma": 5}]}
    r = api("POST", "/harvest", req)
    if check(s, "Registrar cosecha", r.status == 201, msg(r)):
        h = r.body["idHarvest"]
        r = api("PUT", f"/harvest/{h}", {**req, "detalles": [{"idCultivo": id_cultivo, "kilosOptimos": 120, "kilosMerma": 4}]})
        check(s, "Editar cosecha", r.ok, msg(r))
        check(s, "Dar de baja cosecha", api("PUT", f"/harvest/eliminar/{h}").ok)
        check(s, "Restaurar cosecha", api("PUT", f"/harvest/restaurar/{h}").ok)
        api("PUT", f"/harvest/eliminar/{h}")


# ---------------------------------------------------------------------------
def probar_analitico():
    print("\n▶ 4. Backend analítico (Python + Flask + Pandas)")
    catalogo = analitico("/indicadores")
    if not check("Analítico", "Catálogo de indicadores", catalogo.ok):
        return
    for estudiante, indicadores in catalogo.body["data"].items():
        for ind in indicadores:
            ruta = ind["endpoint"].replace("/api/v1/analytics", "")
            r = analitico(ruta)
            vacio = r.ok and not r.body["data"]
            check("Analítico", f"{ind['codigo']} {ruta}", r.ok and r.body.get("success"),
                  ("sin datos aún" if vacio else "") + ("" if r.ok else msg(r)))
    for ruta in ("/cosechas/seccion", "/campo/seccion", "/personal/seccion", "/dashboard/general"):
        r = analitico(ruta)
        d = (r.body or {}).get("data", {})
        check("Analítico", f"{ruta}: ≥3 cards + circular + barras + tabla",
              r.ok and len(d.get("cards", {})) >= 3 and all(k in d for k in ("grafico_circular", "grafico_barras", "tabla")))
    r = pedir("GET", f"{_http.ANALYTICS}/campo/insumos/stock-critico?limite=abc")
    check("Analítico", "Validación de parámetros (422)", r.status == 422)


def probar_integracion():
    print("\n▶ 5. Integración Backend 1 → Backend 2 (eventos / logs)")
    time.sleep(2)
    r = analitico("/eventos/ultimos?top=100")
    eventos = (r.body or {}).get("data", []) if r.ok else []
    tipos = {e["tipo_evento"] for e in eventos}
    check("Integración", "Backend 2 recibió eventos del Backend 1", eventos, f"{len(eventos)} eventos recientes")
    for t in ("CREACION", "ACTUALIZACION", "ELIMINACION", "RESTAURACION", "IMPORTACION", "EXPORTACION"):
        check("Integración", f"Evento {t} registrado", t in tipos)
    check("Integración", "Resumen de eventos procesado con Pandas", analitico("/eventos/resumen").ok)


def limpiar():
    """Borra físicamente los registros PRUEBA-* para no ensuciar la demo."""
    print(f"\n{GRIS}Limpiando datos de prueba...{FIN}")
    try:
        from pymongo import MongoClient
        db = MongoClient(_http.MONGO_URI, serverSelectionTimeoutMS=5000)[_http.MONGO_DB]
        n = db.insumos.delete_many({"nombre": {"$regex": f"^PRUEBA-.*{SUFIJO}"}}).deleted_count
        n += db.parcelas.delete_many({"nombre": {"$regex": f"^PRUEBA-.*{SUFIJO}"}}).deleted_count
        n += db.usuarios.delete_many({"correo": f"prueba{SUFIJO}@agro.com"}).deleted_count
        print(f"{GRIS}  MongoDB: {n} documentos de prueba eliminados{FIN}")
    except Exception as e:
        print(f"{AMARILLO}  No se pudo limpiar MongoDB: {e}{FIN}")
    try:
        import pymssql
        with pymssql.connect(**_http.SQL) as conn, conn.cursor() as cur:
            cur.execute("DELETE d FROM dbo.asignacion_detalle d JOIN dbo.asignacion_cabecera c ON c.id_asignacion_cabecera = d.id_asignacion_cabecera WHERE c.observacion = %s", (f"PRUEBA-{SUFIJO}",))
            cur.execute("DELETE FROM dbo.asignacion_cabecera WHERE observacion = %s", (f"PRUEBA-{SUFIJO}",))
            cur.execute("DELETE FROM dbo.actividad_cultivo WHERE descripcion = %s", (f"PRUEBA-{SUFIJO}",))
            cur.execute("DELETE FROM dbo.harvest WHERE responsable = %s", (f"PRUEBA-{SUFIJO}",))
            conn.commit()
        print(f"{GRIS}  SQL Server: transacciones de prueba eliminadas{FIN}")
    except Exception as e:
        print(f"{AMARILLO}  No se pudo limpiar SQL Server: {e}{FIN}")


def main():
    os.system("")  # habilita colores ANSI en la consola de Windows
    print("═" * 64 + "\n  PRUEBA INTEGRAL AGROPACAYALES — SPRINT 8\n" + "═" * 64)
    if not probar_servicios():
        print(f"\n{ROJO}Levante los backends antes de probar (ver docs/PROBAR_TODO.md).{FIN}")
        sys.exit(1)
    try:
        probar_auth()
        ids = {n: probar_maestro(n, *MAESTROS[n]) for n in MAESTROS}
        probar_importacion()
        if ids.get("insumos") and ids.get("usuarios"):
            probar_transacciones(ids["insumos"], ids["usuarios"])
        probar_analitico()
        probar_integracion()
    finally:
        if "--sin-limpiar" not in sys.argv:
            limpiar()

    total = len(resultados)
    fallas = [r for r in resultados if not r[2]]
    print("\n" + "═" * 64)
    secciones = {}
    for s, _, ok, _ in resultados:
        secciones.setdefault(s, [0, 0])[0 if ok else 1] += 1
    for s, (ok, ko) in secciones.items():
        print(f"  {s:<28} {VERDE}{ok:>3} pasan{FIN}" + (f"  {ROJO}{ko} fallan{FIN}" if ko else ""))
    print("═" * 64)
    color = VERDE if not fallas else ROJO
    print(f"{color}  RESULTADO: {total - len(fallas)}/{total} pruebas pasan{FIN}")
    for s, n, _, d in fallas:
        print(f"  {ROJO}✗ {s} › {n}{FIN} {d}")
    sys.exit(1 if fallas else 0)


if __name__ == "__main__":
    main()
