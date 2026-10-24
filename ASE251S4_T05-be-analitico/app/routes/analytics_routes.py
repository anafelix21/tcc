from flask import Blueprint, jsonify
from app.services.analytics.agropacayales_analytics_service import AgroPacayalesAnalyticsService

analytics_bp = Blueprint("analytics", __name__)
service = AgroPacayalesAnalyticsService()

# ============================================================================
# SERVICIO ANALÍTICO 1: PRESUPUESTO DE INSUMOS POR CATEGORÍA (HUGO FERNÁNDEZ)
# ============================================================================
@analytics_bp.route("/analytics/presupuesto/insumos-categoria", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/insumos-categoria", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/insumos", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/insumos", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/almacen-categorias", methods=["GET"])
@analytics_bp.route("/analytics/insumos/valorizacion", methods=["GET"])
def presupuesto_insumos_categoria():
    """
    Servicio Analítico 1:
    Presupuesto y Distribución de Gastos en Insumos por Categoría.
    Alimentado por un Pipeline de Agregación nativo en MongoDB ($group + $multiply).
    Responsable: Hugo Adrián Fernández Audante.
    """
    try:
        data = service.get_presupuesto_insumos_categoria()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e), "message": "Error al calcular agregación de insumos"}), 500


# ============================================================================
# SERVICIO ANALÍTICO 2: HECTÁREAS Y PRESUPUESTO POR CULTIVO (AXEL HUAPAYA)
# ============================================================================
@analytics_bp.route("/analytics/presupuesto/parcelas-cultivo", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/parcelas-cultivo", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/parcelas", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/parcelas", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/costos-parcelas", methods=["GET"])
@analytics_bp.route("/analytics/parcelas/rendimiento", methods=["GET"])
def presupuesto_parcelas_cultivo():
    """
    Servicio Analítico 2:
    Hectáreas y Presupuesto por Cultivo.
    Alimentado por un Pipeline de Agregación nativo en MongoDB ($group de hectáreas por cultivo).
    Responsable: Axel Huapaya.
    """
    try:
        data = service.get_presupuesto_parcelas_cultivo()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e), "message": "Error al calcular agregación de parcelas"}), 500


# ============================================================================
# SERVICIO ANALÍTICO 3: STOCK CRÍTICO Y COMPRAS URGENTES (ANA FÉLIX)
# ============================================================================
@analytics_bp.route("/analytics/presupuesto/stock-critico", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/stock-critico", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/proyeccion-compras", methods=["GET"])
@analytics_bp.route("/api/v1/analytics/presupuesto/proyeccion-compras", methods=["GET"])
@analytics_bp.route("/analytics/presupuesto/cosecha-ganancia", methods=["GET"])
@analytics_bp.route("/analytics/insumos/stock-critico", methods=["GET"])
def presupuesto_stock_critico():
    """
    Servicio Analítico 3:
    Presupuesto Proyectado de Compra para Reposición de Insumos Críticos.
    Alimentado por Pipeline de Agregación nativo ($match < 30, $project con $subtract y $multiply).
    Responsable: Ana Félix.
    """
    try:
        data = service.get_presupuesto_stock_critico_reposicion()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e), "message": "Error al calcular presupuesto de reposición"}), 500
