"""Datos simulados de SQL Server y MongoDB para probar los indicadores sin bases de datos reales."""
import pandas as pd
import pytest
from app.main import create_app
from app.config.cache import cache
from app.models import insumo, parcela, usuario
from app.repositories.maestros_repo import maestros_repo
from app.repositories.transacciones_repo import transacciones_repo
from app.repositories.eventos_repo import eventos_repo

INSUMOS_MONGO = pd.DataFrame([
    # Spring guarda BigDecimal como texto en Mongo -> precio "85.5"
    {"_id": "i1", "nombre": "Urea", "precio": "85.5", "stock": 150, "unidad_medida": "kg", "tipo_insumo": "FERTILIZANTE", "proveedor": "Fertisur", "estado": True},
    {"_id": "i2", "nombre": "Glifosato", "precio": "120.00", "stock": 10, "unidad_medida": "L", "tipo_insumo": "HERBICIDA", "proveedor": "Bayer", "estado": True},
    {"_id": "i3", "nombre": "Semilla Maíz", "precio": "300", "stock": 5, "unidad_medida": "saco", "tipo_insumo": "semilla", "proveedor": "INIA", "estado": True},
    {"_id": "i4", "nombre": "Insumo eliminado", "precio": "50", "stock": 1, "unidad_medida": "kg", "tipo_insumo": "FERTILIZANTE", "proveedor": "X", "estado": False},
])

PARCELAS_MONGO = pd.DataFrame([
    {"_id": "p1", "nombre": "Parcela Norte 1", "area_hectareas": "12.5", "tipo_suelo": "Arcilloso", "produccion_estimada": "50 toneladas", "en_uso": True, "estado": True},
    {"_id": "p2", "nombre": "Parcela Sur 2", "area_hectareas": "8", "tipo_suelo": "Arenoso", "produccion_estimada": "1200 kg", "en_uso": False, "estado": True},
])

USUARIOS_MONGO = pd.DataFrame([
    {"_id": "u1", "nombre": "Hugo", "apellido": "Fernández", "correo": "hugo@agro.com", "rol": "ADMIN", "estado": True},
    {"_id": "u2", "nombre": "Ana", "apellido": "Félix", "correo": "ana@agro.com", "rol": "operario", "estado": True},
    {"_id": "u3", "nombre": "Axel", "apellido": "Huapaya", "correo": "axel@agro.com", "rol": "OPERARIO", "estado": False},
])

COSECHAS_SQL = pd.DataFrame([
    {"id_harvest": 1, "responsable": "Ana Félix", "fecha_cosecha": "2026-03-14", "id_harvest_detail": 1, "kilos_optimos": 900, "kilos_merma": 100, "id_cultivo": 1, "cultivo": "Palta Hass", "tipo_cultivo": "Frutal", "id_parcela": "p1"},
    {"id_harvest": 1, "responsable": "Ana Félix", "fecha_cosecha": "2026-03-14", "id_harvest_detail": 2, "kilos_optimos": 400, "kilos_merma": 100, "id_cultivo": 2, "cultivo": "Maíz", "tipo_cultivo": "Cereal", "id_parcela": "p2"},
    {"id_harvest": 2, "responsable": "Hugo Fernández", "fecha_cosecha": "2026-04-02", "id_harvest_detail": 3, "kilos_optimos": 500, "kilos_merma": 0, "id_cultivo": 1, "cultivo": "Palta Hass", "tipo_cultivo": "Frutal", "id_parcela": "p1"},
])

ACTIVIDADES_SQL = pd.DataFrame([
    {"id_actividad": 1, "id_cultivo": 1, "tipo_actividad": "Fumigación", "fecha_actividad": "2026-03-01", "costo_total": 500, "completado": True, "cultivo": "Palta Hass"},
    {"id_actividad": 2, "id_cultivo": 1, "tipo_actividad": "Riego", "fecha_actividad": "2026-03-02", "costo_total": 200, "completado": False, "cultivo": "Palta Hass"},
    {"id_actividad": 3, "id_cultivo": 2, "tipo_actividad": "Fumigación", "fecha_actividad": "2026-03-05", "costo_total": 300, "completado": True, "cultivo": "Maíz"},
])

CONSUMO_SQL = pd.DataFrame([
    {"id_detalle": 1, "id_actividad": 1, "id_insumo": "i1", "cantidad": 50, "precio_unitario": 85.5, "subtotal": 4275, "tipo_actividad": "Fumigación"},
    {"id_detalle": 2, "id_actividad": 3, "id_insumo": "i1", "cantidad": 50, "precio_unitario": 85.5, "subtotal": 4275, "tipo_actividad": "Fumigación"},
    {"id_detalle": 3, "id_actividad": 1, "id_insumo": "i2", "cantidad": 10, "precio_unitario": 120, "subtotal": 1200, "tipo_actividad": "Fumigación"},
    {"id_detalle": 4, "id_actividad": 2, "id_insumo": "zz", "cantidad": 1, "precio_unitario": 10, "subtotal": 10, "tipo_actividad": "Riego"},
])

ASIGNACIONES_SQL = pd.DataFrame([
    # Cabecera 1 con dos trabajadores: horas/costo de la cabecera NO deben sumarse dos veces
    {"id_asignacion_cabecera": 1, "fecha_asignacion": "2026-03-01", "horas_trabajadas": 8, "costo_total_mano_obra": 200, "id_asignacion_detalle": 1, "id_usuario": "u1", "costo_mano_obra": 100, "tipo_actividad": "Fumigación"},
    {"id_asignacion_cabecera": 1, "fecha_asignacion": "2026-03-01", "horas_trabajadas": 8, "costo_total_mano_obra": 200, "id_asignacion_detalle": 2, "id_usuario": "u2", "costo_mano_obra": 100, "tipo_actividad": "Fumigación"},
    {"id_asignacion_cabecera": 2, "fecha_asignacion": "2026-04-10", "horas_trabajadas": 4, "costo_total_mano_obra": 80, "id_asignacion_detalle": 3, "id_usuario": "u1", "costo_mano_obra": 80, "tipo_actividad": "Riego"},
])


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(maestros_repo, "insumos", lambda: insumo.normalizar(INSUMOS_MONGO))
    monkeypatch.setattr(maestros_repo, "parcelas", lambda: parcela.normalizar(PARCELAS_MONGO))
    monkeypatch.setattr(maestros_repo, "usuarios", lambda: usuario.normalizar(USUARIOS_MONGO))
    monkeypatch.setattr(transacciones_repo, "cosechas_detalle", lambda: COSECHAS_SQL.copy())
    monkeypatch.setattr(transacciones_repo, "actividades", lambda: ACTIVIDADES_SQL.copy())
    monkeypatch.setattr(transacciones_repo, "consumo_insumos", lambda: CONSUMO_SQL.copy())
    monkeypatch.setattr(transacciones_repo, "asignaciones_detalle", lambda: ASIGNACIONES_SQL.copy())

    guardados = []
    monkeypatch.setattr(eventos_repo, "guardar", lambda doc: guardados.append(doc) or f"e{len(guardados)}")

    app = create_app(conectar_bd=False)
    app.config["TESTING"] = True
    with app.app_context():
        cache.clear()
    c = app.test_client()
    c.eventos_guardados = guardados
    return c


def data(resp):
    assert resp.status_code == 200, resp.get_json()
    body = resp.get_json()
    assert body["success"] is True
    return body["data"]
