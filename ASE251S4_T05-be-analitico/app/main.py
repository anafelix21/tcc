import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flasgger import Swagger
from pydantic import ValidationError
from app.config.settings import settings
from app.config.cache import cache
from app.database.mongo_db import mongo_db
from app.database.sql_db import SQLDatabase
from app.routes.dashboard_routes import dashboard_bp
from app.routes.cosechas_routes import cosechas_bp
from app.routes.actividades_insumos_routes import actividades_insumos_bp
from app.routes.personal_routes import personal_bp
from app.routes.eventos_routes import eventos_bp
from app.routes.status import status_bp
from app.routes.analytics_routes import analytics_bp
from app.config.swagger import swagger_bp
from app.utils.response import success_response

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AgroPacayalesAnalytics")

API = '/api/v1/analytics'

# Catálogo de indicadores por estudiante (6 c/u) — se expone en /api/v1/analytics/indicadores
INDICADORES = {
    "Ana Félix - Cosechas y Rendimiento": [
        {"codigo": "A1", "endpoint": f"{API}/cosechas/resumen", "visual": "cards"},
        {"codigo": "A2", "endpoint": f"{API}/cosechas/calidad", "visual": "gráfico circular"},
        {"codigo": "A3", "endpoint": f"{API}/cosechas/por-cultivo", "visual": "gráfico de barras"},
        {"codigo": "A4", "endpoint": f"{API}/cosechas/mensual", "visual": "línea / barras"},
        {"codigo": "A5", "endpoint": f"{API}/cosechas/por-responsable", "visual": "tabla"},
        {"codigo": "A6", "endpoint": f"{API}/cosechas/rendimiento-parcela", "visual": "tabla (SQL + Mongo)"},
    ],
    "Hugo Fernández - Actividades e Insumos": [
        {"codigo": "H1", "endpoint": f"{API}/campo/actividades/resumen", "visual": "cards"},
        {"codigo": "H2", "endpoint": f"{API}/campo/actividades/por-tipo", "visual": "gráfico de barras"},
        {"codigo": "H3", "endpoint": f"{API}/campo/insumos/resumen", "visual": "cards"},
        {"codigo": "H4", "endpoint": f"{API}/campo/insumos/por-tipo", "visual": "gráfico circular"},
        {"codigo": "H5", "endpoint": f"{API}/campo/insumos/stock-critico", "visual": "tabla"},
        {"codigo": "H6", "endpoint": f"{API}/campo/insumos/consumo", "visual": "tabla (SQL + Mongo)"},
    ],
    "Axel Huapaya - Personal y Mano de Obra": [
        {"codigo": "X1", "endpoint": f"{API}/personal/resumen", "visual": "cards"},
        {"codigo": "X2", "endpoint": f"{API}/personal/por-rol", "visual": "gráfico circular"},
        {"codigo": "X3", "endpoint": f"{API}/personal/mano-obra-por-actividad", "visual": "gráfico de barras"},
        {"codigo": "X4", "endpoint": f"{API}/personal/ranking-trabajadores", "visual": "tabla (SQL + Mongo)"},
        {"codigo": "X5", "endpoint": f"{API}/personal/mensual", "visual": "línea / barras"},
        {"codigo": "X6", "endpoint": f"{API}/personal/parcelas-por-suelo", "visual": "barras"},
    ],
}


def create_app(conectar_bd=True):
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    app.config['SWAGGER'] = {
        'title': 'AgroPacayales Analytics API - Sprint 8',
        'description': 'Backend 2 Analítico (Python + Flask + Pandas): indicadores por estudiante, '
                       'dashboard general e ingesta de eventos/logs del Backend 1.',
        'version': '2.0.0',
        'uiversion': 3,
    }
    app.json.ensure_ascii = False
    Swagger(app)
    cache.init_app(app)

    if conectar_bd:
        mongo_db.connect()
        SQLDatabase.init_pool()

    # Blueprints Estándar PIT Valle Grande (1 servicio analítico por integrante)
    app.register_blueprint(status_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(swagger_bp)

    # Blueprints Analíticos de Secciones / Métricas (Frontend Web Dashboard)
    app.register_blueprint(dashboard_bp, url_prefix=f'{API}/dashboard')
    app.register_blueprint(cosechas_bp, url_prefix=f'{API}/cosechas')
    app.register_blueprint(actividades_insumos_bp, url_prefix=f'{API}/campo')
    app.register_blueprint(personal_bp, url_prefix=f'{API}/personal')
    app.register_blueprint(eventos_bp, url_prefix=f'{API}/eventos')

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({
            "success": False,
            "message": "Datos de entrada inválidos",
            "errors": [{"campo": ".".join(map(str, e["loc"])), "detalle": e["msg"]} for e in error.errors()],
        }), 422

    @app.errorhandler(404)
    def handle_404_error(error):
        return jsonify({"success": False, "message": "El endpoint analítico solicitado no existe"}), 404

    @app.errorhandler(Exception)
    def handle_global_error(error):
        logger.error(f"Excepción no manejada: {error}", exc_info=True)
        detalle = str(error) if settings.FLASK_DEBUG else "Ocurrió un error inesperado en el backend analítico."
        return jsonify({"success": False, "message": "Error Interno del Servidor Analítico",
                        "error_detail": detalle}), 500

    @app.get("/dashboard")
    def dashboard_estatico():
        return send_from_directory(app.static_folder, "dashboard.html")

    @app.get(f"{API}/indicadores")
    def indicadores():
        """
        Catálogo de los 18 indicadores (6 por estudiante)
        ---
        tags: [Dashboard General]
        responses:
          200: {description: Indicadores agrupados por estudiante}
        """
        return success_response(INDICADORES)

    @app.get("/health")
    def health():
        """
        Healthcheck (liveness/readiness de Kubernetes)
        ---
        tags: [Monitoreo]
        responses:
          200: {description: Estado del servicio y de las bases de datos}
        """
        return success_response(
            data={"status": "UP", "mongodb": "UP" if mongo_db.ping() else "DOWN",
                  "sqlserver": "UP" if SQLDatabase.ping() else "DOWN"},
            message="Backend analítico operando correctamente",
        )

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)
