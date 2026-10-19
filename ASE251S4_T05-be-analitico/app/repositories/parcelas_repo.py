from app.database.mongo_db import mongo_db
import logging

logger = logging.getLogger(__name__)

class ParcelasRepository:

    def get_resumen_parcelas(self):
        db = mongo_db.get_db()
        if db is None:
            return {
                "total_parcelas": 0,
                "hectareas_totales": 0.0,
                "parcelas_en_uso": 0,
                "parcelas_libres": 0,
                "produccion_estimada_total_kg": 0.0
            }

        try:
            col = db["parcelas"]
            total = col.count_documents({"estado": True})
            en_uso = col.count_documents({"estado": True, "enUso": True})
            libres = max(0, total - en_uso)

            pipeline = [
                {"$match": {"estado": True}},
                {
                    "$group": {
                        "_id": None,
                        "hectareas": {"$sum": "$areaHectareas"},
                        "produccion": {"$sum": "$produccionEstimada"}
                    }
                }
            ]
            agg = list(col.aggregate(pipeline))
            hectareas = agg[0]["hectareas"] if agg else 0.0
            produccion = agg[0]["produccion"] if agg else 0.0

            return {
                "total_parcelas": total,
                "hectareas_totales": round(float(hectareas), 2),
                "parcelas_en_uso": en_uso,
                "parcelas_libres": libres,
                "produccion_estimada_total_kg": round(float(produccion), 2)
            }
        except Exception as e:
            logger.error(f"Error consultando resumen de parcelas en MongoDB: {e}")
            return {
                "total_parcelas": 0,
                "hectareas_totales": 0.0,
                "parcelas_en_uso": 0,
                "parcelas_libres": 0,
                "produccion_estimada_total_kg": 0.0,
                "error": str(e)
            }

    def get_distribucion_suelo(self):
        db = mongo_db.get_db()
        if db is None:
            return []

        try:
            col = db["parcelas"]
            pipeline = [
                {"$match": {"estado": True}},
                {
                    "$group": {
                        "_id": "$tipoSuelo",
                        "total_parcelas": {"$sum": 1},
                        "hectareas": {"$sum": "$areaHectareas"}
                    }
                },
                {"$sort": {"hectareas": -1}}
            ]
            rows = list(col.aggregate(pipeline))
            resultado = []
            for r in rows:
                resultado.append({
                    "tipo_suelo": r.get("_id") or "NO ESPECIFICADO",
                    "total_parcelas": r.get("total_parcelas", 0),
                    "hectareas": round(float(r.get("hectareas", 0.0)), 2)
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando distribución de suelo: {e}")
            return []

parcelas_repo = ParcelasRepository()
