from flask import Blueprint, jsonify
from app.database.mongodb import check_connection

status_bp = Blueprint("status", __name__)

@status_bp.route("/", methods=["GET"])
def inicio():
    """Ruta raíz para verificar que el Backend Analítico está activo."""
    return jsonify({
        "estado": "Operativo",
        "servicio": "Backend Analítico AgroPacayales",
        "asignatura": "PIT - Proyectos de Innovación Tecnológica",
        "equipo": "Grupo T05",
        "version": "1.0.0",
        "swagger_docs": "/docs",
        "mensaje": "Backend Analitico funcionando correctamente"
    })

@status_bp.route("/status/database", methods=["GET"])
def status_database():
    """
    Ruta para validar la conexión con MongoDB Atlas
    y listar las colecciones configuradas (Evidencia 2).
    """
    result = check_connection()
    status_code = 200 if result.get("connected") else 500
    return jsonify(result), status_code
