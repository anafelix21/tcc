import logging
import pandas as pd
from pymongo import MongoClient
from app.config.settings import settings

logger = logging.getLogger(__name__)


class MongoDB:
    """Conexión a MongoDB (Atlas o instancia EC2, puerto 27017)."""
    client = None
    db = None

    @classmethod
    def connect(cls):
        try:
            cls.client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
            cls.db = cls.client[settings.MONGO_DB_NAME]
            cls.client.admin.command('ping')
            logger.info("✅ Conectado a MongoDB exitosamente (AgroPacayales)")
        except Exception as e:
            logger.warning(f"⚠️ Alerta conectando a MongoDB: {e}")

    @classmethod
    def get_db(cls):
        if cls.db is None:
            cls.connect()
        return cls.db

    @classmethod
    def find_df(cls, collection, query=None, projection=None):
        """Lee una colección y la devuelve como DataFrame de Pandas (vacío si Mongo no responde)."""
        db = cls.get_db()
        if db is None:
            return pd.DataFrame()
        try:
            docs = list(db[collection].find(query or {}, projection))
            for d in docs:
                if "_id" in d:
                    d["_id"] = str(d["_id"])
            return pd.DataFrame(docs)
        except Exception as e:
            logger.warning(f"⚠️ Consulta MongoDB '{collection}' fallida: {e}")
            return pd.DataFrame()

    @classmethod
    def insert_one(cls, collection, document):
        db = cls.get_db()
        if db is None:
            raise ConnectionError("MongoDB no disponible")
        result = db[collection].insert_one(document)
        return str(result.inserted_id)

    @classmethod
    def ping(cls):
        try:
            cls.get_db()
            cls.client.admin.command('ping')
            return True
        except Exception:
            return False


mongo_db = MongoDB()
