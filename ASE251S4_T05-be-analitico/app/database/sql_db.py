import time
import urllib.parse
import logging
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app.config.settings import settings

logger = logging.getLogger(__name__)


class SQLDatabase:
    """Pool de conexiones a SQL Server (Docker local o Amazon RDS, puerto 1433)."""
    engine = None
    caido_hasta = 0.0

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
                pool_recycle=1800,
                pool_pre_ping=True,
                connect_args={"login_timeout": 5, "timeout": 15},
            )
            logger.info("✅ Connection Pool de SQL Server inicializado (AgroPacayales)")
        except Exception as e:
            logger.warning(f"⚠️ Error inicializando pool de SQL Server: {e}")

    @classmethod
    def read_df(cls, query, params=None):
        """Ejecuta una consulta SELECT y devuelve un DataFrame de Pandas.
        Si SQL Server no está disponible devuelve un DataFrame vacío (el servicio responde en cero)."""
        if cls.engine is None:
            cls.init_pool()
        if cls.engine is None or time.time() < cls.caido_hasta:
            return pd.DataFrame()
        try:
            with cls.engine.connect() as conn:
                return pd.read_sql(text(query), conn, params=params or {})
        except OperationalError as e:
            # Evita esperar el timeout en cada indicador mientras SQL Server está caído
            cls.caido_hasta = time.time() + 30
            logger.warning(f"⚠️ SQL Server no disponible, se reintenta en 30s: {e.orig}")
            return pd.DataFrame()
        except Exception as e:
            logger.warning(f"⚠️ Consulta SQL Server fallida: {e}")
            return pd.DataFrame()

    @classmethod
    def ping(cls):
        if cls.engine is None:
            cls.init_pool()
        try:
            with cls.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return True
        except Exception:
            return False


def read_sql_df(query, params=None):
    return SQLDatabase.read_df(query, params)
