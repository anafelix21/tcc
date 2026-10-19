from flask import Blueprint
from app.services.cosechas_service import cosechas_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

cosechas_bp = Blueprint('cosechas', __name__)

@cosechas_bp.route('/resumen', methods=['GET'])
@cache.cached(timeout=60)
def get_resumen_cosechas():
    """
    Resumen de cosechas y análisis de merma
    ---
    tags:
      - Cosechas y Calidad
    responses:
      200:
        description: Total de cosechas, kilos óptimos, kilos de merma y tasa de merma (%)
    """
    try:
        data = cosechas_service.get_resumen()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando resumen de cosechas: {str(e)}", 500)

@cosechas_bp.route('/por-cultivo', methods=['GET'])
@cache.cached(timeout=60)
def get_cosechas_por_cultivo():
    """
    Rendimiento y porcentaje de merma agrupado por cultivo
    ---
    tags:
      - Cosechas y Calidad
    responses:
      200:
        description: Lista de cultivos con sus respectivos kilos óptimos y merma
    """
    try:
        data = cosechas_service.get_por_cultivo()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando cosechas por cultivo: {str(e)}", 500)

@cosechas_bp.route('/mensual', methods=['GET'])
@cache.cached(timeout=60)
def get_cosechas_mensual():
    """
    Serie temporal mensual de cosechas y merma
    ---
    tags:
      - Cosechas y Calidad
    responses:
      200:
        description: Histórico de producción mensual
    """
    try:
        data = cosechas_service.get_mensual()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando histórico mensual de cosechas: {str(e)}", 500)
