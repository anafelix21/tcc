from flask import Blueprint
from app.config.cache import cache
from app.services.dashboard_service import dashboard_service
from app.utils.response import success_response

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.get('/general')
@cache.cached(timeout=60)
def general():
    """
    Dashboard General: indicadores más relevantes de las 3 secciones
    ---
    tags: [Dashboard General]
    responses:
      200: {description: "cards, grafico_circular (costos), grafico_barras (cosecha por cultivo), tabla (consumo de insumos)"}
    """
    return success_response(dashboard_service.general(), message="Dashboard general generado")
