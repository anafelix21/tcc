"""Sección 2 — Hugo Fernández: Actividades de campo e Insumos (6 indicadores)."""
from flask import Blueprint, request
from app.config.cache import cache
from app.schemas.query_schema import LimiteQuery, TopQuery
from app.services.actividades_insumos_service import actividades_insumos_service as svc
from app.utils.response import success_response

actividades_insumos_bp = Blueprint('actividades_insumos', __name__)


@actividades_insumos_bp.get('/actividades/resumen')
@cache.cached(timeout=60)
def resumen_actividades():
    """
    [H1] Resumen de actividades de campo (cards): total, cumplimiento y costo
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    responses:
      200: {description: "total_actividades, completadas, pendientes, tasa_cumplimiento_pct, costo_total_acumulado"}
    """
    return success_response(svc.resumen_actividades())


@actividades_insumos_bp.get('/actividades/por-tipo')
@cache.cached(timeout=60)
def actividades_por_tipo():
    """
    [H2] Costo y cumplimiento por tipo de actividad (gráfico de barras)
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    responses:
      200: {description: "Fumigación, Riego, Fertilización, Poda... con costo acumulado"}
    """
    return success_response(svc.actividades_por_tipo())


@actividades_insumos_bp.get('/insumos/resumen')
@cache.cached(timeout=60, query_string=True)
def resumen_insumos():
    """
    [H3] Resumen de inventario (cards): insumos, stock, valorización y críticos
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    parameters:
      - {name: limite, in: query, type: integer, default: 20, description: Umbral de stock crítico}
    responses:
      200: {description: "total_insumos, stock_total_unidades, valor_total_inventario, insumos_stock_critico"}
    """
    q = LimiteQuery(**request.args.to_dict())
    return success_response(svc.resumen_insumos(q.limite))


@actividades_insumos_bp.get('/insumos/por-tipo')
@cache.cached(timeout=60)
def insumos_por_tipo():
    """
    [H4] Distribución del inventario por tipo de insumo (gráfico circular)
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    responses:
      200: {description: "Items, stock, valor y % del valor por tipo de insumo"}
    """
    return success_response(svc.insumos_por_tipo())


@actividades_insumos_bp.get('/insumos/stock-critico')
@cache.cached(timeout=30, query_string=True)
def stock_critico():
    """
    [H5] Insumos con stock crítico (tabla)
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    parameters:
      - {name: limite, in: query, type: integer, default: 20, description: Umbral de unidades mínimas}
    responses:
      200: {description: "Lista de insumos con stock menor o igual al umbral"}
    """
    q = LimiteQuery(**request.args.to_dict())
    return success_response(svc.stock_critico(q.limite))


@actividades_insumos_bp.get('/insumos/consumo')
@cache.cached(timeout=60, query_string=True)
def consumo_insumos():
    """
    [H6] Insumos más consumidos en campo (SQL Server detalle_actividad + MongoDB insumos)
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    parameters:
      - {name: top, in: query, type: integer, default: 10}
    responses:
      200: {description: "Cantidad consumida, gasto, stock actual e índice de rotación por insumo"}
    """
    q = TopQuery(**request.args.to_dict())
    return success_response(svc.consumo_insumos(q.top))


@actividades_insumos_bp.get('/seccion')
@cache.cached(timeout=60)
def seccion():
    """
    Dashboard de la sección de Hugo Fernández (cards + circular + barras + tabla)
    ---
    tags: [Hugo Fernández - Actividades e Insumos]
    responses:
      200: {description: "Todos los indicadores de la sección en una sola respuesta"}
    """
    return success_response(svc.seccion())
