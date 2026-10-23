"""Sección 3 — Axel Huapaya: Personal y Mano de Obra (6 indicadores)."""
from flask import Blueprint, request
from app.config.cache import cache
from app.schemas.query_schema import TopQuery
from app.services.personal_service import personal_service
from app.utils.response import success_response

personal_bp = Blueprint('personal', __name__)


@personal_bp.get('/resumen')
@cache.cached(timeout=60)
def resumen():
    """
    [X1] Resumen de personal y mano de obra (cards)
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "usuarios activos/inactivos, asignaciones, horas, costo y costo promedio por hora"}
    """
    return success_response(personal_service.resumen())


@personal_bp.get('/por-rol')
@cache.cached(timeout=60)
def por_rol():
    """
    [X2] Personal activo por rol (gráfico circular)
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "Cantidad y porcentaje de usuarios activos por rol"}
    """
    return success_response(personal_service.por_rol())


@personal_bp.get('/mano-obra-por-actividad')
@cache.cached(timeout=60)
def mano_obra_por_actividad():
    """
    [X3] Horas y costo de mano de obra por tipo de actividad (gráfico de barras)
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "Asignaciones, horas y costo por tipo de actividad"}
    """
    return success_response(personal_service.mano_obra_por_actividad())


@personal_bp.get('/ranking-trabajadores')
@cache.cached(timeout=60, query_string=True)
def ranking_trabajadores():
    """
    [X4] Ranking de trabajadores por costo de mano de obra (SQL Server + MongoDB usuarios)
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    parameters:
      - {name: top, in: query, type: integer, default: 10}
    responses:
      200: {description: "Trabajador, rol, asignaciones y costo acumulado"}
    """
    q = TopQuery(**request.args.to_dict())
    return success_response(personal_service.ranking_trabajadores(q.top))


@personal_bp.get('/mensual')
@cache.cached(timeout=60)
def mensual():
    """
    [X5] Evolución mensual de horas trabajadas y costo de mano de obra
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "Serie temporal YYYY-MM"}
    """
    return success_response(personal_service.mensual())


@personal_bp.get('/parcelas-por-suelo')
@cache.cached(timeout=60)
def parcelas_por_suelo():
    """
    [X6] Hectáreas, parcelas en uso y producción estimada por tipo de suelo
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "Distribución de parcelas (MongoDB) por tipo de suelo"}
    """
    return success_response(personal_service.parcelas_por_suelo())


@personal_bp.get('/seccion')
@cache.cached(timeout=60)
def seccion():
    """
    Dashboard de la sección de Axel Huapaya (cards + circular + barras + tabla)
    ---
    tags: [Axel Huapaya - Personal y Mano de Obra]
    responses:
      200: {description: "Todos los indicadores de la sección en una sola respuesta"}
    """
    return success_response(personal_service.seccion())
