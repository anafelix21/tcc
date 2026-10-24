from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config.settings import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MongoDB")

client = None
db = None

try:
    client = MongoClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000
    )
    db = client[settings.MONGO_DATABASE]
    logger.info(f"Conexión inicializada con la base de datos: {settings.MONGO_DATABASE}")
except Exception as e:
    logger.error(f"Error al inicializar cliente MongoDB: {e}")
    client = None
    db = None

def get_database():
    """Retorna la instancia activa de la base de datos MongoDB."""
    global client, db
    if db is None:
        try:
            client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
            db = client[settings.MONGO_DATABASE]
        except Exception as e:
            logger.error(f"Reintento fallido de conexión MongoDB: {e}")
    return db

def check_connection():
    """
    Verifica el estado de la conexión con MongoDB Atlas
    y lista las colecciones disponibles.
    """
    active_db = get_database()
    if client is None or active_db is None:
        return {
            "status": "error",
            "connected": False,
            "message": "Cliente de MongoDB no inicializado"
        }
    try:
        # Ping al servidor para validar conexión
        client.admin.command('ping')
        collections = active_db.list_collection_names()
        return {
            "status": "success",
            "connected": True,
            "database": settings.MONGO_DATABASE,
            "collections_count": len(collections),
            "collections": collections,
            "message": "Conexión a MongoDB Atlas establecida exitosamente"
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Fallo al conectar con MongoDB: {e}")
        return {
            "status": "error",
            "connected": False,
            "error": str(e),
            "message": "No se pudo establecer conexión con MongoDB Atlas"
        }
