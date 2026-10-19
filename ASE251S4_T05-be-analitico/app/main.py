import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger
from app.config.settings import settings
from app.config.cache import cache
from app.database.mongo_db import mongo_db
from app.database.sql_db import SQLDatabase
from app.routes.dashboard_routes import dashboard_bp
from app.routes.cosechas_routes import cosechas_bp
from app.routes.actividades_routes import actividades_bp
from app.routes.insumos_routes import insumos_bp
from app.routes.parcelas_routes import parcelas_bp
from app.routes.personal_routes import personal_bp
from app.utils.response import success_response

# Configuración de logs
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("AgroPacayalesAnalytics")

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Swagger (Documentación interactiva OpenAPI)
    app.config['SWAGGER'] = {
        'title': 'AgroPacayales Analytics API - TCC Sprint 8',
        'description': 'Backend Analítico para métricas agrícolas, cosechas, mermas, inventario y costos operativos',
        'version': '1.0.0',
        'uiversion': 3
    }
    Swagger(app)

    # Inicializar Caché
    cache.init_app(app)

    # Inicializar Conexiones a Bases de Datos
    mongo_db.connect()
    SQLDatabase.init_pool()

    # Registrar rutas (Blueprints)
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1/analytics/dashboard')
    app.register_blueprint(cosechas_bp, url_prefix='/api/v1/analytics/cosechas')
    app.register_blueprint(actividades_bp, url_prefix='/api/v1/analytics/actividades')
    app.register_blueprint(insumos_bp, url_prefix='/api/v1/analytics/insumos')
    app.register_blueprint(parcelas_bp, url_prefix='/api/v1/analytics/parcelas')
    app.register_blueprint(personal_bp, url_prefix='/api/v1/analytics/personal')

    # Manejo Global de Errores
    @app.errorhandler(Exception)
    def handle_global_error(error):
        logger.error(f"Excepción no manejada: {str(error)}", exc_info=True)
        detalle = str(error) if settings.FLASK_DEBUG else "Ocurrió un error inesperado en el backend analítico."
        return jsonify({
            "success": False,
            "message": "Error Interno del Servidor Analítico",
            "error_detail": detalle
        }), 500

    @app.errorhandler(404)
    def handle_404_error(error):
        return jsonify({
            "success": False,
            "message": "El endpoint analítico solicitado no existe"
        }), 404

    @app.route("/")
    def index():
        return jsonify({
            "proyecto": "AgroPacayales - Backend Analítico",
            "version": "1.0.0",
            "status": "online",
            "swagger_docs": "/apidocs"
        })

    @app.route("/health")
    def health():
        """
        Endpoint de salud (Healthcheck) para Docker y AWS
        ---
        tags:
          - Monitoreo
        responses:
          200:
            description: Estado de operatividad del servidor
        """
        return success_response(
            data={"status": "UP", "backend": "AgroPacayales Analytics Python"},
            message="Backend analítico operando correctamente"
        )

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=settings.FLASK_PORT, debug=settings.FLASK_DEBUG)
