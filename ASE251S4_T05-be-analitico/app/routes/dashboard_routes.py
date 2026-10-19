from flask import Blueprint
from app.services.dashboard_service import dashboard_service
from app.utils.response import success_response, error_response
from app.config.cache import cache

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/kpis', methods=['GET'])
@cache.cached(timeout=60)
def get_dashboard_kpis():
    """
    Resumen ejecutivo consolidado para el Dashboard General de AgroPacayales
    ---
    tags:
      - Dashboard General
    responses:
      200:
        description: KPIs consolidados de producción agrícola, calidad de cosecha, costos y stock
    """
    try:
        data = dashboard_service.get_kpis_consolidados()
        return success_response(data, message="Dashboard analítico generado exitosamente")
    except Exception as e:
        return error_response(f"Error generando dashboard: {str(e)}", 500)
