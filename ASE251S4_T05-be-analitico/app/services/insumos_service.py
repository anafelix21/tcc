from app.repositories.insumos_repo import insumos_repo

class InsumosService:

    def get_resumen(self):
        return insumos_repo.get_resumen_insumos()

    def get_stock_critico(self, limite=20):
        return insumos_repo.get_stock_critico(limite)

    def get_distribucion_tipo(self):
        return insumos_repo.get_distribucion_por_tipo()

insumos_service = InsumosService()
