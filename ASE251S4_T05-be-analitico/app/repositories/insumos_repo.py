from app.database.mongo_db import mongo_db
import logging

logger = logging.getLogger(__name__)

class InsumosRepository:

    def get_resumen_insumos(self):
        db = mongo_db.get_db()
        if db is None:
            return {
                "total_insumos": 0,
                "stock_total_unidades": 0,
                "valor_total_inventario": 0.0,
                "insumos_stock_critico": 0
            }

        try:
            col = db["insumos"]
            total = col.count_documents({"estado": True})

            # Pipeline de agregación para calcular stock total y valorización económica
            pipeline = [
                {"$match": {"estado": True}},
                {
                    "$group": {
                        "_id": None,
                        "stock_total": {"$sum": "$stock"},
                        "valor_total": {"$sum": {"$multiply": ["$precio", "$stock"]}}
                    }
                }
            ]
            agg = list(col.aggregate(pipeline))
            stock_total = agg[0]["stock_total"] if agg else 0
            valor_total = agg[0]["valor_total"] if agg else 0.0

            # Conteo de insumos con stock crítico (<= 20 unidades)
            criticos = col.count_documents({"estado": True, "stock": {"$lte": 20}})

            return {
                "total_insumos": total,
                "stock_total_unidades": int(stock_total),
                "valor_total_inventario": round(float(valor_total), 2),
                "insumos_stock_critico": criticos
            }
        except Exception as e:
            logger.error(f"Error consultando resumen de insumos en MongoDB: {e}")
            return {
                "total_insumos": 0,
                "stock_total_unidades": 0,
                "valor_total_inventario": 0.0,
                "insumos_stock_critico": 0,
                "error": str(e)
            }

    def get_stock_critico(self, limite=20):
        db = mongo_db.get_db()
        if db is None:
            return []

        try:
            col = db["insumos"]
            cursor = col.find({"estado": True, "stock": {"$lte": limite}}).sort("stock", 1)
            resultado = []
            for doc in cursor:
                resultado.append({
                    "id": str(doc.get("_id", "")),
                    "nombre": doc.get("nombre", ""),
                    "tipoInsumo": doc.get("tipoInsumo", ""),
                    "stock": doc.get("stock", 0),
                    "unidadMedida": doc.get("unidadMedida", ""),
                    "precio": doc.get("precio", 0.0),
                    "proveedor": doc.get("proveedor", "")
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando stock crítico en MongoDB: {e}")
            return []

    def get_distribucion_por_tipo(self):
        db = mongo_db.get_db()
        if db is None:
            return []

        try:
            col = db["insumos"]
            pipeline = [
                {"$match": {"estado": True}},
                {
                    "$group": {
                        "_id": "$tipoInsumo",
                        "total_items": {"$sum": 1},
                        "stock_acumulado": {"$sum": "$stock"},
                        "valor_acumulado": {"$sum": {"$multiply": ["$precio", "$stock"]}}
                    }
                },
                {"$sort": {"valor_acumulado": -1}}
            ]
            rows = list(col.aggregate(pipeline))
            resultado = []
            for r in rows:
                resultado.append({
                    "tipo_insumo": r.get("_id") or "NO ESPECIFICADO",
                    "total_items": r.get("total_items", 0),
                    "stock_acumulado": r.get("stock_acumulado", 0),
                    "valor_acumulado": round(float(r.get("valor_acumulado", 0.0)), 2)
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando distribución por tipo de insumo: {e}")
            return []

insumos_repo = InsumosRepository()
