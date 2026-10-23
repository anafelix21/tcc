"""Lectura de transacciones en SQL Server (cosechas, actividades, asignaciones)."""
import pandas as pd
from app.database.sql_db import read_sql_df


def _con_columnas(df, columnas):
    if df.empty:
        return pd.DataFrame(columns=columnas)
    return df


class TransaccionesRepository:

    def cosechas_detalle(self):
        """Una fila por detalle de cosecha (Ana Félix: harvest + harvest_planting_cycle + cultivos)."""
        df = read_sql_df("""
            SELECT h.id_harvest, h.responsable, h.fecha_cosecha,
                   d.id_harvest_detail, d.kilos_optimos, d.kilos_merma,
                   c.id_cultivo, c.nombre AS cultivo, c.tipo_cultivo, c.id_parcela
            FROM dbo.harvest h
            LEFT JOIN dbo.harvest_planting_cycle d ON d.id_harvest = h.id_harvest
            LEFT JOIN dbo.cultivos c ON c.id_cultivo = d.id_cultivo
            WHERE h.estado = 1
        """)
        return _con_columnas(df, ["id_harvest", "responsable", "fecha_cosecha", "id_harvest_detail",
                                  "kilos_optimos", "kilos_merma", "id_cultivo", "cultivo",
                                  "tipo_cultivo", "id_parcela"])

    def actividades(self):
        """Cabecera de actividades de cultivo (Hugo Fernández)."""
        df = read_sql_df("""
            SELECT a.id_actividad, a.id_cultivo, a.tipo_actividad, a.fecha_actividad,
                   a.costo_total, a.completado, c.nombre AS cultivo
            FROM dbo.actividad_cultivo a
            LEFT JOIN dbo.cultivos c ON c.id_cultivo = a.id_cultivo
            WHERE a.estado = 1
        """)
        return _con_columnas(df, ["id_actividad", "id_cultivo", "tipo_actividad", "fecha_actividad",
                                  "costo_total", "completado", "cultivo"])

    def consumo_insumos(self):
        """Detalle de insumos consumidos por actividad (id_insumo = _id de MongoDB)."""
        df = read_sql_df("""
            SELECT d.id_detalle, d.id_actividad, d.id_insumo, d.cantidad,
                   d.precio_unitario, d.subtotal, a.tipo_actividad
            FROM dbo.detalle_actividad d
            INNER JOIN dbo.actividad_cultivo a ON a.id_actividad = d.id_actividad
            WHERE a.estado = 1
        """)
        return _con_columnas(df, ["id_detalle", "id_actividad", "id_insumo", "cantidad",
                                  "precio_unitario", "subtotal", "tipo_actividad"])

    def asignaciones_detalle(self):
        """Asignación de trabajadores (Axel Huapaya): cabecera + detalle + tipo de actividad."""
        df = read_sql_df("""
            SELECT ac.id_asignacion_cabecera, ac.fecha_asignacion, ac.horas_trabajadas,
                   ac.costo_total_mano_obra, ad.id_asignacion_detalle, ad.id_usuario,
                   ad.costo_mano_obra, a.tipo_actividad
            FROM dbo.asignacion_cabecera ac
            LEFT JOIN dbo.asignacion_detalle ad ON ad.id_asignacion_cabecera = ac.id_asignacion_cabecera
            LEFT JOIN dbo.actividad_cultivo a ON a.id_actividad = ac.id_actividad
            WHERE ac.estado = 1
        """)
        return _con_columnas(df, ["id_asignacion_cabecera", "fecha_asignacion", "horas_trabajadas",
                                  "costo_total_mano_obra", "id_asignacion_detalle", "id_usuario",
                                  "costo_mano_obra", "tipo_actividad"])


transacciones_repo = TransaccionesRepository()
