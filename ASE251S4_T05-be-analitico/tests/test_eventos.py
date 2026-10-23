API = "/api/v1/analytics/eventos"


def test_ingesta_evento_valido(client):
    r = client.post(API, json={"tipo_evento": "CREACION", "entidad": "insumo", "entidad_id": "i1",
                               "detalle": {"nombre": "Urea"}})
    assert r.status_code == 201
    doc = client.eventos_guardados[0]
    assert doc["entidad"] == "INSUMO"
    assert doc["fecha_evento"] is not None and doc["fecha_ingesta"] is not None


def test_ingesta_evento_invalido(client):
    r = client.post(API, json={"tipo_evento": "BORRADO_TOTAL", "entidad": "INSUMO"})
    assert r.status_code == 422
    assert r.get_json()["errors"][0]["campo"] == "tipo_evento"


def test_ingesta_lote(client):
    r = client.post(f"{API}/lote", json={"eventos": [
        {"tipo_evento": "IMPORTACION", "entidad": "INSUMO"},
        {"tipo_evento": "ELIMINACION", "entidad": "PARCELA"},
    ]})
    assert r.status_code == 201 and r.get_json()["data"]["total"] == 2
