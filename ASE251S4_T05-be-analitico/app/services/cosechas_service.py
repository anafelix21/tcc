from app.repositories.cosechas_repo import cosechas_repo

class CosechasService:

    def get_resumen(self):
        return cosechas_repo.get_resumen_cosechas()

    def get_por_cultivo(self):
        return cosechas_repo.get_cosechas_por_cultivo()

    def get_mensual(self):
        return cosechas_repo.get_cosechas_mensual()

cosechas_service = CosechasService()
