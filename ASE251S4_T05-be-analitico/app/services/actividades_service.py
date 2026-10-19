from app.repositories.actividades_repo import actividades_repo

class ActividadesService:

    def get_resumen(self):
        return actividades_repo.get_resumen_actividades()

    def get_por_tipo(self):
        return actividades_repo.get_actividades_por_tipo()

    def get_insumos_consumidos(self):
        return actividades_repo.get_insumos_consumidos_resumen()

actividades_service = ActividadesService()
