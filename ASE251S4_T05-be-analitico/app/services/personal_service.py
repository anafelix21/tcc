from app.repositories.usuarios_repo import usuarios_repo
from app.repositories.asignaciones_repo import asignaciones_repo

class PersonalService:

    def get_resumen(self):
        usuarios_data = usuarios_repo.get_resumen_usuarios()
        mano_obra_data = asignaciones_repo.get_resumen_mano_obra()

        return {
            "usuarios": usuarios_data,
            "mano_obra": mano_obra_data
        }

personal_service = PersonalService()
