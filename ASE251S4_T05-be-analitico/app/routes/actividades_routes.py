from flask import Blueprint
from app.services.actividades_service import actividades_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

actividades_bp = Blueprint('actividades', __name__)

@actividades_bp.route('/resumen', methods=['GET'])
@cache.cached(timeout=60)
def get_resumen_actividades():
    """
    Resumen ejecutivo de actividades de cultivo y costos operativos
    ---
    tags:
      - Actividades y Costos
    responses:
      200:
        description: Total de actividades, tasa de cumplimiento (%) y costo acumulado
    """
    try:
        data = actividades_service.get_resumen()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando resumen de actividades: {str(e)}", 500)

@actividades_bp.route('/por-tipo', methods=['GET'])
@cache.cached(timeout=60)
def get_actividades_por_tipo():
    """
    Distribución de actividades y costos agrupados por tipo (Fumigación, Riego, etc.)
    ---
    tags:
      - Actividades y Costos
    responses:
      200:
        description: Lista de tipos de actividad con sus costos acumulados
    """
    try:
        data = actividades_service.get_por_tipo()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando actividades por tipo: {str(e)}", 500)

@actividades_bp.route('/insumos-consumidos', methods=['GET'])
@cache.cached(timeout=60)
def get_insumos_consumidos():
    """
    Insumos consumidos en labores agrícolas con cantidades y gastos
    ---
    tags:
      - Actividades y Costos
    responses:
      200:
        description: Detalle de insumos consumidos en las actividades
    """
    try:
        data = actividades_service.get_insumos_consumidos()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando insumos consumidos: {str(e)}", 500)
