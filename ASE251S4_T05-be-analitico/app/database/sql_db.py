import urllib.parse
from sqlalchemy import create_engine
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class SQLDatabase:
    engine = None

    @classmethod
    def init_pool(cls):
        try:
            encoded_password = urllib.parse.quote_plus(settings.SQL_PASSWORD)
            conn_str = (
                f"mssql+pymssql://{settings.SQL_USER}:{encoded_password}@"
                f"{settings.SQL_SERVER}:{settings.SQL_PORT}/{settings.SQL_DATABASE}"
            )
            cls.engine = create_engine(
                conn_str,
                pool_size=10,
                max_overflow=20,
                pool_timeout=15,
                pool_recycle=1800
            )
            logger.info("✅ Connection Pool de SQL Server inicializado con éxito (AgroPacayales)")
        except Exception as e:
            logger.warning(f"⚠️ Error inicializando pool de SQL Server: {e}")

    @classmethod
    def get_connection(cls):
        if cls.engine is None:
            cls.init_pool()
        try:
            if cls.engine:
                return cls.engine.raw_connection()
        except Exception as e:
            logger.warning(f"⚠️ Error obteniendo conexión de SQL Server: {e}")
        return None

def get_sql_connection():
    return SQLDatabase.get_connection()
