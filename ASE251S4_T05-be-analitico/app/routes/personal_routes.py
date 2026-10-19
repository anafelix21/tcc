from flask import Blueprint
from app.services.personal_service import personal_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

personal_bp = Blueprint('personal', __name__)

@personal_bp.route('/resumen', methods=['GET'])
@cache.cached(timeout=60)
def get_resumen_personal():
    """
    Resumen de recursos humanos y costos de mano de obra
    ---
    tags:
      - Personal y Mano de Obra
    responses:
      200:
        description: Usuarios activos, distribución por rol y horas de trabajo registradas
    """
    try:
        data = personal_service.get_resumen()
        return success_response(data)
    except Exception as e:
        return error_response(f"Error consultando resumen de personal: {str(e)}", 500)
