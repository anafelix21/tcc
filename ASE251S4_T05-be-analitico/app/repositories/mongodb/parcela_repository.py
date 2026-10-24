from app.database.mongodb import get_database

class ParcelaRepository:
    def __init__(self):
        self._collection_name = None

    @property
    def db(self):
        return get_database()

    @property
    def collection_name(self):
        if self._collection_name is None:
            db = self.db
            if db is not None:
                cols = db.list_collection_names()
                self._collection_name = "plots" if "plots" in cols else "parcelas"
            else:
                self._collection_name = "plots"
        return self._collection_name

    @property
    def collection(self):
        db = self.db
        if db is not None:
            return db[self.collection_name]
        return None

    def aggregate_hectareas_por_cultivo(self):
        """
        Ejecuta un Pipeline de Agregación nativo en MongoDB Atlas:
        Agrupa las parcelas por cultivo actual y calcula las hectáreas totales cultivadas.
        Implementado por: Axel Huapaya.
        """
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "$ifNull": [
                            "$cultivo_actual",
                            {"$ifNull": ["$cultivoActual.variedad", {"$ifNull": ["$cultivoActual", "Sin Cultivo"]}]}
                        ]
                    },
                    "total_lotes": {"$sum": 1},
                    "hectareas_totales": {
                        "$sum": {
                            "$toDouble": {
                                "$ifNull": ["$area_hectareas", {"$ifNull": ["$areaHectareas", "$hectareas"]}]
                            }
                        }
                    },
                    "fundos_asociados": {
                        "$addToSet": {"$ifNull": ["$fundo", {"$ifNull": ["$ubicacion", "Cañete"]}]}
                    }
                }
            },
            {
                "$sort": {"hectareas_totales": -1}
            }
        ]
        return list(self.collection.aggregate(pipeline))
