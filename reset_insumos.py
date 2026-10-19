import sys
from pymongo import MongoClient

def reset():
    client = MongoClient('mongodb+srv://axelhuapaya_db_user:lider2021@cluster0.oyk6ogs.mongodb.net/?appName=Cluster0')
    db = client['agropacayales_db']
    count = db['insumos'].count_documents({})
    res = db['insumos'].delete_many({})
    print(f"Colección 'insumos' limpiada con éxito: {res.deleted_count} documentos eliminados.")
    print("¡Listo para empezar tu video y que /importar/csv responda 15 importados y 0 fallidos!")

if __name__ == '__main__':
    reset()
