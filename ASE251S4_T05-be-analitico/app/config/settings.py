import os
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

class Settings:
    # MongoDB Config (Atlas o Local)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://hugofernandez_db_user:PmHQ4BXXbNvyxo6v@cluster0.pzehdgj.mongodb.net/agropacayales_db?retryWrites=true&w=majority")
    MONGO_DATABASE = os.getenv("MONGO_DATABASE", os.getenv("MONGO_DB_NAME", "agropacayales_db"))
    MONGO_DB_NAME = MONGO_DATABASE

    # SQL Server Config (Docker o Amazon RDS)
    SQL_SERVER = os.getenv("SQL_SERVER", "localhost")
    SQL_PORT = os.getenv("SQL_PORT", "1433")
    SQL_DATABASE = os.getenv("SQL_DATABASE", "agropacayales_db")
    SQL_USER = os.getenv("SQL_USER", "sa")
    SQL_PASSWORD = os.getenv("SQL_PASSWORD", "AgroPacayales2026!")

    # Flask Config
    PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", 5000)))
    FLASK_PORT = PORT
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() in ("true", "1", "t")

settings = Settings()
