"""Sección 1 — Ana Félix: Cosechas y Rendimiento (6 indicadores)."""
from flask import Blueprint
from app.config.cache import cache
from app.services.cosechas_service import cosechas_service
from app.utils.response import success_response

cosechas_bp = Blueprint('cosechas', __name__)


@cosechas_bp.get('/resumen')
@cache.cached(timeout=60)
def resumen():
    """
    [A1] Resumen de cosechas (cards): total, kilos óptimos, merma y eficiencia
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "total_cosechas, kilos_optimos, kilos_merma, kilos_totales, tasa_merma_pct, eficiencia_cosecha_pct"}
    """
    return success_response(cosechas_service.resumen())


@cosechas_bp.get('/calidad')
@cache.cached(timeout=60)
def calidad():
    """
    [A2] Calidad de cosecha: óptimo vs merma (gráfico circular)
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Kilos y porcentaje por categoría de calidad"}
    """
    return success_response(cosechas_service.calidad())


@cosechas_bp.get('/por-cultivo')
@cache.cached(timeout=60)
def por_cultivo():
    """
    [A3] Producción y merma por cultivo (gráfico de barras)
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Kilos óptimos, merma y tasa de merma por cultivo"}
    """
    return success_response(cosechas_service.por_cultivo())


@cosechas_bp.get('/mensual')
@cache.cached(timeout=60)
def mensual():
    """
    [A4] Evolución mensual de la producción cosechada
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Serie temporal YYYY-MM con kilos óptimos y merma"}
    """
    return success_response(cosechas_service.mensual())


@cosechas_bp.get('/por-responsable')
@cache.cached(timeout=60)
def por_responsable():
    """
    [A5] Desempeño de cosecha por responsable (tabla)
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Cosechas, kilos y tasa de merma por responsable"}
    """
    return success_response(cosechas_service.por_responsable())


@cosechas_bp.get('/rendimiento-parcela')
@cache.cached(timeout=60)
def rendimiento_parcela():
    """
    [A6] Rendimiento kg/ha por parcela (SQL Server cosechas + MongoDB parcelas)
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Kilos cosechados, hectáreas y rendimiento kg/ha por parcela"}
    """
    return success_response(cosechas_service.rendimiento_por_parcela())


@cosechas_bp.get('/seccion')
@cache.cached(timeout=60)
def seccion():
    """
    Dashboard de la sección de Ana Félix (cards + circular + barras + tabla)
    ---
    tags: [Ana Félix - Cosechas]
    responses:
      200: {description: "Todos los indicadores de la sección en una sola respuesta"}
    """
    return success_response(cosechas_service.seccion())
