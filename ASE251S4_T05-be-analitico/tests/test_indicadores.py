from tests.conftest import data

API = "/api/v1/analytics"


# ---------- Sección Ana Félix: Cosechas ----------
def test_a1_resumen_cosechas(client):
    d = data(client.get(f"{API}/cosechas/resumen"))
    assert d["total_cosechas"] == 2
    assert d["kilos_totales"] == 2000
    assert d["tasa_merma_pct"] == 10.0
    assert d["eficiencia_cosecha_pct"] == 90.0


def test_a2_calidad(client):
    d = data(client.get(f"{API}/cosechas/calidad"))
    assert [x["porcentaje"] for x in d] == [90.0, 10.0]


def test_a3_por_cultivo(client):
    d = data(client.get(f"{API}/cosechas/por-cultivo"))
    assert d[0]["cultivo"] == "Palta Hass" and d[0]["kilos_totales"] == 1500
    assert d[1]["tasa_merma_pct"] == 20.0


def test_a4_mensual(client):
    d = data(client.get(f"{API}/cosechas/mensual"))
    assert [x["periodo"] for x in d] == ["2026-03", "2026-04"]


def test_a5_por_responsable(client):
    d = data(client.get(f"{API}/cosechas/por-responsable"))
    assert d[0]["responsable"] == "Ana Félix" and d[0]["total_cosechas"] == 1


def test_a6_rendimiento_parcela_cruza_sql_y_mongo(client):
    d = data(client.get(f"{API}/cosechas/rendimiento-parcela"))
    norte = next(x for x in d if x["id_parcela"] == "p1")
    assert norte["parcela"] == "Parcela Norte 1"
    assert norte["rendimiento_kg_ha"] == round(1400 / 12.5, 2)


# ---------- Sección Hugo Fernández: Actividades e Insumos ----------
def test_h1_resumen_actividades(client):
    d = data(client.get(f"{API}/campo/actividades/resumen"))
    assert d["total_actividades"] == 3
    assert d["actividades_completadas"] == 2
    assert d["costo_total_acumulado"] == 1000


def test_h2_actividades_por_tipo(client):
    d = data(client.get(f"{API}/campo/actividades/por-tipo"))
    assert d[0]["tipo_actividad"] == "FUMIGACIÓN" and d[0]["costo_acumulado"] == 800


def test_h3_resumen_insumos_convierte_precio_texto(client):
    d = data(client.get(f"{API}/campo/insumos/resumen"))
    assert d["total_insumos"] == 3  # excluye el eliminado (estado=false)
    assert d["valor_total_inventario"] == round(85.5 * 150 + 120 * 10 + 300 * 5, 2)
    assert d["insumos_stock_critico"] == 2


def test_h4_insumos_por_tipo(client):
    d = data(client.get(f"{API}/campo/insumos/por-tipo"))
    assert {x["tipo_insumo"] for x in d} == {"FERTILIZANTE", "HERBICIDA", "SEMILLA"}
    assert round(sum(x["porcentaje_valor"] for x in d)) == 100


def test_h5_stock_critico_con_limite(client):
    d = data(client.get(f"{API}/campo/insumos/stock-critico?limite=5"))
    assert [x["nombre"] for x in d] == ["Semilla Maíz"]


def test_h6_consumo_cruza_sql_y_mongo(client):
    d = data(client.get(f"{API}/campo/insumos/consumo"))
    assert d[0]["nombre"] == "Urea" and d[0]["cantidad_consumida"] == 100
    assert any(x["nombre"] == "Insumo no encontrado en MongoDB" for x in d)


# ---------- Sección Axel Huapaya: Personal ----------
def test_x1_resumen_personal_no_duplica_cabecera(client):
    d = data(client.get(f"{API}/personal/resumen"))
    assert d["usuarios_activos"] == 2 and d["usuarios_inactivos"] == 1
    assert d["horas_trabajadas_totales"] == 12
    assert d["costo_total_mano_obra"] == 280


def test_x2_por_rol(client):
    d = data(client.get(f"{API}/personal/por-rol"))
    assert {x["rol"]: x["total"] for x in d} == {"ADMIN": 1, "OPERARIO": 1}


def test_x3_mano_obra_por_actividad(client):
    d = data(client.get(f"{API}/personal/mano-obra-por-actividad"))
    assert d[0]["tipo_actividad"] == "FUMIGACIÓN" and d[0]["costo"] == 200


def test_x4_ranking_trabajadores_cruza_sql_y_mongo(client):
    d = data(client.get(f"{API}/personal/ranking-trabajadores?top=1"))
    assert len(d) == 1 and d[0]["trabajador"] == "Hugo Fernández" and d[0]["costo_mano_obra"] == 180


def test_x5_mensual(client):
    d = data(client.get(f"{API}/personal/mensual"))
    assert [x["horas"] for x in d] == [8, 4]


def test_x6_parcelas_por_suelo(client):
    d = data(client.get(f"{API}/personal/parcelas-por-suelo"))
    arcilloso = next(x for x in d if x["tipo_suelo"] == "Arcilloso")
    assert arcilloso["produccion_estimada_kg"] == 50000


# ---------- Dashboards, catálogo, validación ----------
def test_secciones_tienen_cards_circular_barras_tabla(client):
    for url in ("cosechas/seccion", "campo/seccion", "personal/seccion"):
        d = data(client.get(f"{API}/{url}"))
        assert len(d["cards"]) >= 3
        for clave in ("grafico_circular", "grafico_barras", "tabla"):
            assert clave in d


def test_dashboard_general(client):
    d = data(client.get(f"{API}/dashboard/general"))
    assert len(d["cards"]) >= 3 and len(d["grafico_circular"]) == 3
    assert d["grafico_barras"] and d["tabla"]


def test_catalogo_18_indicadores(client):
    d = data(client.get(f"{API}/indicadores"))
    assert sum(len(v) for v in d.values()) == 18


def test_query_invalida_devuelve_422(client):
    r = client.get(f"{API}/campo/insumos/stock-critico?limite=abc")
    assert r.status_code == 422


def test_dataframes_vacios_no_rompen(client, monkeypatch):
    import pandas as pd
    from app.repositories.transacciones_repo import transacciones_repo
    monkeypatch.setattr(transacciones_repo, "cosechas_detalle",
                        lambda: pd.DataFrame(columns=["id_harvest", "responsable", "fecha_cosecha", "id_harvest_detail",
                                                      "kilos_optimos", "kilos_merma", "id_cultivo", "cultivo",
                                                      "tipo_cultivo", "id_parcela"]))
    d = data(client.get(f"{API}/cosechas/seccion"))
    assert d["cards"]["total_cosechas"] == 0
