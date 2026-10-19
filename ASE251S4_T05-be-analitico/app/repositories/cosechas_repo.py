from app.database.sql_db import get_sql_connection
import logging

logger = logging.getLogger(__name__)

class CosechasRepository:

    def get_resumen_cosechas(self):
        conn = get_sql_connection()
        if not conn:
            return {
                "total_cosechas": 0,
                "kilos_optimos": 0.0,
                "kilos_merma": 0.0,
                "kilos_totales": 0.0,
                "tasa_merma_pct": 0.0,
                "eficiencia_cosecha_pct": 100.0,
                "nota": "Sin conexión directa a SQL Server, valores referenciales"
            }

        try:
            cursor = conn.cursor()
            # Métricas agregadas de cosechas y merma
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT h.id_harvest) as total_cosechas,
                    COALESCE(SUM(d.kilos_optimos), 0.0) as kilos_optimos,
                    COALESCE(SUM(d.kilos_merma), 0.0) as kilos_merma
                FROM harvest h
                LEFT JOIN harvest_planting_cycle d ON h.id_harvest = d.id_harvest
                WHERE h.estado = 1
            """)
            row = cursor.fetchone()
            total_cosechas = int(row[0]) if row and row[0] is not None else 0
            kilos_optimos = float(row[1]) if row and row[1] is not None else 0.0
            kilos_merma = float(row[2]) if row and row[2] is not None else 0.0
            kilos_totales = kilos_optimos + kilos_merma
            
            tasa_merma = round((kilos_merma / kilos_totales) * 100, 2) if kilos_totales > 0 else 0.0
            eficiencia = round((kilos_optimos / kilos_totales) * 100, 2) if kilos_totales > 0 else 100.0

            return {
                "total_cosechas": total_cosechas,
                "kilos_optimos": round(kilos_optimos, 2),
                "kilos_merma": round(kilos_merma, 2),
                "kilos_totales": round(kilos_totales, 2),
                "tasa_merma_pct": tasa_merma,
                "eficiencia_cosecha_pct": eficiencia
            }
        except Exception as e:
            logger.error(f"Error consultando resumen de cosechas en SQL Server: {e}")
            return {
                "total_cosechas": 0,
                "kilos_optimos": 0.0,
                "kilos_merma": 0.0,
                "kilos_totales": 0.0,
                "tasa_merma_pct": 0.0,
                "eficiencia_cosecha_pct": 100.0,
                "error": str(e)
            }
        finally:
            conn.close()

    def get_cosechas_por_cultivo(self):
        conn = get_sql_connection()
        if not conn:
            return []

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    c.nombre as cultivo,
                    c.tipo_cultivo,
                    COALESCE(SUM(d.kilos_optimos), 0.0) as kilos_optimos,
                    COALESCE(SUM(d.kilos_merma), 0.0) as kilos_merma,
                    COUNT(d.id_harvest_detail) as registros
                FROM cultivos c
                LEFT JOIN harvest_planting_cycle d ON c.id_cultivo = d.id_cultivo
                GROUP BY c.id_cultivo, c.nombre, c.tipo_cultivo
                ORDER BY kilos_optimos DESC
            """)
            rows = cursor.fetchall()
            resultado = []
            for r in rows:
                optimos = float(r[2]) if r[2] is not None else 0.0
                merma = float(r[3]) if r[3] is not None else 0.0
                tot = optimos + merma
                pct_merma = round((merma / tot) * 100, 2) if tot > 0 else 0.0
                resultado.append({
                    "cultivo": r[0],
                    "tipo_cultivo": r[1],
                    "kilos_optimos": round(optimos, 2),
                    "kilos_merma": round(merma, 2),
                    "kilos_totales": round(tot, 2),
                    "tasa_merma_pct": pct_merma,
                    "registros": int(r[4])
                })
            return resultado
        except Exception as e:
            logger.error(f"Error consultando cosechas por cultivo: {e}")
            return []
        finally:
            conn.close()

    def get_cosechas_mensual(self):
        conn = get_sql_connection()
        if not conn:
            return []

        try:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    CONVERT(VARCHAR(7), h.fecha_cosecha, 120) as periodo,
                    COUNT(DISTINCT h.id_harvest) as total_cosechas,
                    COALESCE(SUM(d.kilos_optimos), 0.0) as kilos_optimos,
                    COALESCE(SUM(d.kilos_merma), 0.0) as kilos_merma
                FROM harvest h
                LEFT JOIN harvest_planting_cycle d ON h.id_harvest = d.id_harvest
                WHERE h.fecha_cosecha IS NOT NULL
                GROUP BY CONVERT(VARCHAR(7), h.fecha_cosecha, 120)
                ORDER BY periodo ASC
            """)
            rows = cursor.fetchall()
            mensual = []
            for r in rows:
                optimos = float(r[2]) if r[2] is not None else 0.0
                merma = float(r[3]) if r[3] is not None else 0.0
                tot = optimos + merma
                mensual.append({
                    "periodo": r[0],
                    "total_cosechas": int(r[1]),
                    "kilos_optimos": round(optimos, 2),
                    "kilos_merma": round(merma, 2),
                    "kilos_totales": round(tot, 2)
                })
            return mensual
        except Exception as e:
            logger.error(f"Error consultando evolución mensual de cosechas: {e}")
            return []
        finally:
            conn.close()

cosechas_repo = CosechasRepository()
