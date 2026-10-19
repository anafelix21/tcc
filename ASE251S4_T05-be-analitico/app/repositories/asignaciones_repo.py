from app.database.sql_db import get_sql_connection
import logging

logger = logging.getLogger(__name__)

class AsignacionesRepository:

    def get_resumen_mano_obra(self):
        conn = get_sql_connection()
        if not conn:
            return {
                "total_asignaciones": 0,
                "horas_trabajadas_totales": 0.0,
                "costo_total_mano_obra": 0.0,
                "costo_promedio_por_hora": 0.0
            }

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(id_asignacion_cabecera) as total_asignaciones,
                    COALESCE(SUM(horas_trabajadas), 0.0) as horas_totales,
                    COALESCE(SUM(costo_total_mano_obra), 0.0) as costo_mano_obra
                FROM asignacion_cabecera
                WHERE estado = 1
            """)
            row = cursor.fetchone()
            total_asig = int(row[0]) if row and row[0] is not None else 0
            horas = float(row[1]) if row and row[1] is not None else 0.0
            costo = float(row[2]) if row and row[2] is not None else 0.0

            promedio_hora = round(costo / horas, 2) if horas > 0 else 0.0

            return {
                "total_asignaciones": total_asig,
                "horas_trabajadas_totales": round(horas, 2),
                "costo_total_mano_obra": round(costo, 2),
                "costo_promedio_por_hora": promedio_hora
            }
        except Exception as e:
            logger.error(f"Error consultando asignaciones en SQL Server: {e}")
            return {
                "total_asignaciones": 0,
                "horas_trabajadas_totales": 0.0,
                "costo_total_mano_obra": 0.0,
                "costo_promedio_por_hora": 0.0,
                "error": str(e)
            }
        finally:
            conn.close()

asignaciones_repo = AsignacionesRepository()
