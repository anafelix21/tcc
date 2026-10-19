import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

class Settings:
    # MongoDB Config (Atlas o Local)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://axelhuapaya_db_user:lider2021@cluster0.oyk6ogs.mongodb.net/?appName=Cluster0")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "agropacayales_db")

    # SQL Server Config (Docker o Amazon RDS)
    SQL_SERVER = os.getenv("SQL_SERVER", "localhost")
    SQL_PORT = os.getenv("SQL_PORT", "1433")
    SQL_DATABASE = os.getenv("SQL_DATABASE", "agropacayales_db")
    SQL_USER = os.getenv("SQL_USER", "sa")
    SQL_PASSWORD = os.getenv("SQL_PASSWORD", "AgroPacayales2026!")

    # Flask Config
    FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

settings = Settings()
