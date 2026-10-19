from app.repositories.parcelas_repo import parcelas_repo

class ParcelasService:

    def get_resumen(self):
        return parcelas_repo.get_resumen_parcelas()

    def get_distribucion_suelo(self):
        return parcelas_repo.get_distribucion_suelo()

parcelas_service = ParcelasService()
