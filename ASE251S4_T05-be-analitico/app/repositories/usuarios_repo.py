from app.database.mongo_db import mongo_db
import logging

logger = logging.getLogger(__name__)

class UsuariosRepository:

    def get_resumen_usuarios(self):
        db = mongo_db.get_db()
        if db is None:
            return {
                "total_usuarios": 0,
                "usuarios_activos": 0,
                "usuarios_inactivos": 0,
                "roles": []
            }

        try:
            col = db["usuarios"]
            total = col.count_documents({})
            activos = col.count_documents({"estado": True})
            inactivos = max(0, total - activos)

            pipeline = [
                {"$match": {"estado": True}},
                {
                    "$group": {
                        "_id": "$rol",
                        "total": {"$sum": 1}
                    }
                },
                {"$sort": {"total": -1}}
            ]
            roles_agg = list(col.aggregate(pipeline))
            roles = [{"rol": r.get("_id") or "SIN_ROL", "cantidad": r.get("total", 0)} for r in roles_agg]

            return {
                "total_usuarios": total,
                "usuarios_activos": activos,
                "usuarios_inactivos": inactivos,
                "roles": roles
            }
        except Exception as e:
            logger.error(f"Error consultando resumen de usuarios en MongoDB: {e}")
            return {
                "total_usuarios": 0,
                "usuarios_activos": 0,
                "usuarios_inactivos": 0,
                "roles": [],
                "error": str(e)
            }

usuarios_repo = UsuariosRepository()
