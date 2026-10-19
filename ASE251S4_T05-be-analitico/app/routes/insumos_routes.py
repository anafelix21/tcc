from flask import Blueprint, request
from app.services.insumos_service import insumos_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

insumos_bp = Blueprint('insumos', __name__)

@insumos_bp.route('/resumen', methods=['GET'])
@cache.cached(timeout=60)
def get_resumen_insumos():
    """
    Resumen de inventario y valorización económica del stock
    ---
    tags:
      - Inventario de Insumos
    responses:
      200:
        description: Total de insumos, unidades disponibles y valor total del almacén
    """
    try:
        data = insumos_service.get_resumen()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando resumen de insumos: {str(e)}", 500)

@insumos_bp.route('/stock-critico', methods=['GET'])
@cache.cached(timeout=30)
def get_stock_critico():
    """
    Alerta temprana de insumos con stock por debajo del umbral de seguridad
    ---
    tags:
      - Inventario de Insumos
    parameters:
      - name: limite
        in: query
        type: integer
        required: false
        default: 20
        description: Umbral de unidades mínimas para considerar stock crítico
    responses:
      200:
        description: Lista de insumos en nivel crítico de inventario
    """
    try:
        limite = request.args.get('limite', default=20, type=int)
        data = insumos_service.get_stock_critico(limite)
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando stock crítico: {str(e)}", 500)

@insumos_bp.route('/por-tipo', methods=['GET'])
@cache.cached(timeout=60)
def get_distribucion_tipo():
    """
    Distribución de insumos y valorización por tipo (Fertilizante, Insecticida, etc.)
    ---
    tags:
      - Inventario de Insumos
    responses:
      200:
        description: Categorización de insumos por tipo
    """
    try:
        data = insumos_service.get_distribucion_tipo()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando distribución por tipo: {str(e)}", 500)
