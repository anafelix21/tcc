from app.database.sql_db import get_sql_connection
import logging

logger = logging.getLogger(__name__)

class ActividadesRepository:

    def get_resumen_actividades(self):
        conn = get_sql_connection()
        if not conn:
            return {
                "total_actividades": 0,
                "actividades_completadas": 0,
                "actividades_pendientes": 0,
                "tasa_cumplimiento_pct": 0.0,
                "costo_total_acumulado": 0.0,
                "costo_promedio_actividad": 0.0
            }

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    COUNT(id_actividad) as total_actividades,
                    SUM(CASE WHEN completado = 1 THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN completado = 0 OR completado IS NULL THEN 1 ELSE 0 END) as pendientes,
                    COALESCE(SUM(costo_total), 0.0) as costo_total
                FROM actividad_cultivo
                WHERE estado = 1
            """)
            row = cursor.fetchone()
            total = int(row[0]) if row and row[0] is not None else 0
            completadas = int(row[1]) if row and row[1] is not None else 0
            pendientes = int(row[2]) if row and row[2] is not None else 0
            costo_total = float(row[3]) if row and row[3] is not None else 0.0

            tasa_cumplimiento = round((completadas / total) * 100, 2) if total > 0 else 0.0
            costo_promedio = round(costo_total / total, 2) if total > 0 else 0.0

            return {
                "total_actividades": total,
                "actividades_completadas": completadas,
                "actividades_pendientes": pendientes,
                "tasa_cumplimiento_pct": tasa_cumplimiento,
                "costo_total_acumulado": round(costo_total, 2),
                "costo_promedio_actividad": costo_promedio
            }
        except Exception as e:
            logger.error(f"Error consultando resumen de actividades en SQL Server: {e}")
            return {
                "total_actividades": 0,
                "actividades_completadas": 0,
                "actividades_pendientes": 0,
                "tasa_cumplimiento_pct": 0.0,
                "costo_total_acumulado": 0.0,
                "costo_promedio_actividad": 0.0,
                "error": str(e)
            }
        finally:
            conn.close()

    def get_actividades_por_tipo(self):
        conn = get_sql_connection()
        if not conn:
            return []

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    tipo_actividad,
                    COUNT(id_actividad) as total,
                    SUM(CASE WHEN completado = 1 THEN 1 ELSE 0 END) as completadas,
                    COALESCE(SUM(costo_total), 0.0) as costo_acumulado
                FROM actividad_cultivo
                WHERE estado = 1
                GROUP BY tipo_actividad
                ORDER BY costo_acumulado DESC
            """)
            rows = cursor.fetchall()
            resultado = []
            for r in rows:
                resultado.append({
                    "tipo_actividad": r[0],
                    "total": int(r[1]),
                    "completadas": int(r[2]),
                    "costo_acumulado": round(float(r[3]), 2)
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando actividades por tipo: {e}")
            return []
        finally:
            conn.close()

    def get_insumos_consumidos_resumen(self):
        conn = get_sql_connection()
        if not conn:
            return []

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    id_insumo,
                    SUM(cantidad) as cantidad_total,
                    AVG(precio_unitario) as precio_promedio,
                    SUM(subtotal) as gasto_total
                FROM detalle_actividad
                GROUP BY id_insumo
                ORDER BY gasto_total DESC
            """)
            rows = cursor.fetchall()
            resultado = []
            for r in rows:
                resultado.append({
                    "id_insumo": r[0],
                    "cantidad_total": int(r[1]) if r[1] is not None else 0,
                    "precio_promedio": round(float(r[2]), 2) if r[2] is not None else 0.0,
                    "gasto_total": round(float(r[3]), 2) if r[3] is not None else 0.0
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando insumos consumidos: {e}")
            return []
        finally:
            conn.close()

actividades_repo = ActividadesRepository()
