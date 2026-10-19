from flask import Blueprint
from app.services.parcelas_service import parcelas_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

parcelas_bp = Blueprint('parcelas', __name__)

@parcelas_bp.route('/resumen', methods=['GET'])
@cache.cached(timeout=60)
def get_resumen_parcelas():
    """
    Resumen de parcelas agrícolas, hectáreas cultivadas y capacidad productiva
    ---
    tags:
      - Parcelas y Terrenos
    responses:
      200:
        description: Total parcelas, hectáreas y producción estimada
    """
    try:
        data = parcelas_service.get_resumen()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando resumen de parcelas: {str(e)}", 500)

@parcelas_bp.route('/por-suelo', methods=['GET'])
@cache.cached(timeout=60)
def get_distribucion_suelo():
    """
    Distribución de parcelas y hectáreas según el tipo de suelo
    ---
    tags:
      - Parcelas y Terrenos
    responses:
      200:
        description: Análisis agronómico de suelos (Arcilloso, Arenoso, Franco)
    """
    try:
        data = parcelas_service.get_distribucion_suelo()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando distribución de suelo: {str(e)}", 500)
