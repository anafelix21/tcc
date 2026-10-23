"""Ingesta de eventos de negocio y logs de actividad enviados por el Backend 1 (Spring Boot)."""
from flask import Blueprint, request
from app.config.cache import cache
from app.schemas.evento_schema import EventoIn, EventoLoteIn
from app.schemas.query_schema import TopQuery
from app.services.eventos_service import eventos_service
from app.utils.response import success_response

eventos_bp = Blueprint('eventos', __name__)


@eventos_bp.post('')
def ingestar():
    """
    Ingesta de un evento de negocio (lo invoca el Backend 1 dentro del clúster)
    ---
    tags: [Ingesta de Eventos y Logs]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required: [tipo_evento, entidad]
          properties:
            tipo_evento: {type: string, enum: [CREACION, ACTUALIZACION, ELIMINACION, RESTAURACION, IMPORTACION, EXPORTACION, LOGIN, TRANSACCION], example: CREACION}
            entidad: {type: string, example: INSUMO}
            entidad_id: {type: string, example: 6ad6152aff10c27062f23e60}
            origen: {type: string, example: backend-transaccional}
            usuario: {type: string, example: hugo@agro.com}
            detalle: {type: object, example: {nombre: Urea, stock: 150}}
    responses:
      201: {description: "Evento almacenado en MongoDB (eventos_negocio)"}
      422: {description: "Datos inválidos"}
    """
    evento = EventoIn(**(request.get_json(silent=True) or {}))
    evento_id = eventos_service.ingestar(evento)
    return success_response({"id": evento_id}, message="Evento ingerido", status_code=201)


@eventos_bp.post('/lote')
def ingestar_lote():
    """
    Ingesta masiva de eventos (por ejemplo, logs acumulados)
    ---
    tags: [Ingesta de Eventos y Logs]
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            eventos: {type: array, items: {type: object}}
    responses:
      201: {description: "Eventos almacenados"}
    """
    lote = EventoLoteIn(**(request.get_json(silent=True) or {}))
    ids = eventos_service.ingestar_lote(lote)
    return success_response({"ids": ids, "total": len(ids)}, message="Lote ingerido", status_code=201)


@eventos_bp.get('/resumen')
@cache.cached(timeout=15)
def resumen():
    """
    Procesamiento de eventos con Pandas: totales por tipo, entidad y día
    ---
    tags: [Ingesta de Eventos y Logs]
    responses:
      200: {description: "Resumen de la actividad registrada"}
    """
    return success_response(eventos_service.resumen())


@eventos_bp.get('/ultimos')
def ultimos():
    """
    Últimos eventos ingeridos (log de actividad)
    ---
    tags: [Ingesta de Eventos y Logs]
    parameters:
      - {name: top, in: query, type: integer, default: 20}
    responses:
      200: {description: "Eventos más recientes"}
    """
    q = TopQuery(**{"top": 20, **request.args.to_dict()})
    return success_response(eventos_service.ultimos(q.top))
