"""Ingesta y lectura de eventos de negocio / logs (MongoDB `eventos_negocio`)."""
from app.database.mongo_db import mongo_db
from app.models import evento


class EventosRepository:

    def guardar(self, documento):
        return mongo_db.insert_one(evento.COLECCION, documento)

    def listar(self):
        return evento.normalizar(mongo_db.find_df(evento.COLECCION))


eventos_repo = EventosRepository()
