from app.database.mongodb import get_database

class InsumoRepository:
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
                self._collection_name = "supplies" if "supplies" in cols else "insumos"
            else:
                self._collection_name = "supplies"
        return self._collection_name

    @property
    def collection(self):
        db = self.db
        if db is not None:
            return db[self.collection_name]
        return None

    def aggregate_gastos_por_categoria(self):
        """
        Ejecuta un Pipeline de Agregación nativo en MongoDB Atlas:
        Agrupa los insumos por su categoría/tipo y calcula el gasto total (precio * stock).
        Implementado por: Hugo Fernández.
        """
        pipeline = [
            {
                "$match": {
                    "stock": {"$exists": True, "$gt": 0}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$ifNull": ["$tipo_insumo", {"$ifNull": ["$tipoInsumo", "$categoria"]}]
                    },
                    "cantidad_items": {"$sum": 1},
                    "stock_total": {"$sum": "$stock"},
                    "presupuesto_total_pen": {"$sum": {"$multiply": [{"$toDouble": "$precio"}, "$stock"]}},
                    "precio_promedio_pen": {"$avg": {"$toDouble": "$precio"}}
                }
            },
            {
                "$sort": {"presupuesto_total_pen": -1}
            }
        ]
        return list(self.collection.aggregate(pipeline))

    def aggregate_stock_critico_reposicion(self, umbral=15, meta_reposicion=30):
        """
        Ejecuta un Pipeline de Agregación nativo en MongoDB Atlas:
        Filtra insumos con stock crítico y calcula el presupuesto exacto de compra
        (unidades_faltantes * precio).
        Implementado por: Ana Félix.
        """
        # Si el umbral por defecto (15) no encuentra elementos en la BD activa,
        # se adapta dinámicamente al umbral de seguridad operativa (30 unidades, meta 60)
        pipeline_check = [
            {"$match": {"stock": {"$exists": True, "$lte": umbral, "$gt": 0}}},
            {"$limit": 1}
        ]
        items_existen = list(self.collection.aggregate(pipeline_check))
        
        target_umbral = umbral
        target_meta = meta_reposicion
        if not items_existen:
            target_umbral = 30
            target_meta = 60

        pipeline = [
            {
                "$match": {
                    "stock": {"$exists": True, "$lte": target_umbral, "$gt": 0}
                }
            },
            {
                "$project": {
                    "nombre": 1,
                    "categoria": {
                        "$ifNull": ["$tipo_insumo", {"$ifNull": ["$tipoInsumo", "$categoria"]}]
                    },
                    "stock": 1,
                    "precio": {"$toDouble": "$precio"},
                    "proveedor": {"$ifNull": ["$proveedor", "Proveedor Registrado"]},
                    "unidades_a_comprar": {"$subtract": [target_meta, "$stock"]},
                    "costo_reposicion_pen": {
                        "$multiply": [{"$subtract": [target_meta, "$stock"]}, {"$toDouble": "$precio"}]
                    }
                }
            },
            {
                "$sort": {"stock": 1}
            }
        ]
        return list(self.collection.aggregate(pipeline))
