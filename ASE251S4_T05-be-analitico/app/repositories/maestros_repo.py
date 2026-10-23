"""Lectura de maestros en MongoDB (insumos, parcelas, usuarios)."""
from app.database.mongo_db import mongo_db
from app.models import insumo, parcela, usuario


class MaestrosRepository:

    def insumos(self):
        return insumo.normalizar(mongo_db.find_df(insumo.COLECCION))

    def parcelas(self):
        return parcela.normalizar(mongo_db.find_df(parcela.COLECCION))

    def usuarios(self):
        return usuario.normalizar(mongo_db.find_df(usuario.COLECCION, projection=usuario.PROYECCION))


maestros_repo = MaestrosRepository()
