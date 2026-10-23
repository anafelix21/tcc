"""Sección 1 — Ana Félix: Cosechas y Rendimiento (SQL Server + MongoDB parcelas)."""
import pandas as pd
from app.repositories.transacciones_repo import transacciones_repo
from app.repositories.maestros_repo import maestros_repo
from app.utils.dataframe import registros, porcentaje, numerico


class CosechasService:

    def _detalle(self):
        df = transacciones_repo.cosechas_detalle()
        df = numerico(df, ["kilos_optimos", "kilos_merma"])
        df["kilos_totales"] = df["kilos_optimos"] + df["kilos_merma"]
        df["fecha_cosecha"] = pd.to_datetime(df["fecha_cosecha"], errors="coerce")
        df["cultivo"] = df["cultivo"].fillna("SIN CULTIVO")
        df["responsable"] = df["responsable"].fillna("NO ESPECIFICADO")
        return df

    @staticmethod
    def _con_merma(agrupado):
        agrupado["tasa_merma_pct"] = [porcentaje(m, t) for m, t in zip(agrupado["kilos_merma"], agrupado["kilos_totales"])]
        return agrupado

    # A1 — Cards
    def resumen(self):
        df = self._detalle()
        optimos, merma = df["kilos_optimos"].sum(), df["kilos_merma"].sum()
        total = optimos + merma
        return {
            "total_cosechas": int(df["id_harvest"].nunique()),
            "kilos_optimos": round(float(optimos), 2),
            "kilos_merma": round(float(merma), 2),
            "kilos_totales": round(float(total), 2),
            "tasa_merma_pct": porcentaje(merma, total),
            "eficiencia_cosecha_pct": porcentaje(optimos, total),
        }

    # A2 — Gráfico circular
    def calidad(self):
        df = self._detalle()
        optimos, merma = float(df["kilos_optimos"].sum()), float(df["kilos_merma"].sum())
        total = optimos + merma
        return [
            {"categoria": "Óptimo (exportable)", "kilos": round(optimos, 2), "porcentaje": porcentaje(optimos, total)},
            {"categoria": "Merma", "kilos": round(merma, 2), "porcentaje": porcentaje(merma, total)},
        ]

    # A3 — Gráfico de barras
    def por_cultivo(self):
        df = self._detalle()
        df = df[df["id_harvest_detail"].notna()]
        g = (df.groupby("cultivo", as_index=False)
               .agg(kilos_optimos=("kilos_optimos", "sum"), kilos_merma=("kilos_merma", "sum"),
                    kilos_totales=("kilos_totales", "sum"), registros=("id_harvest_detail", "count"))
               .sort_values("kilos_totales", ascending=False))
        return registros(self._con_merma(g))

    # A4 — Serie mensual (barras / línea)
    def mensual(self):
        df = self._detalle().dropna(subset=["fecha_cosecha"])
        if df.empty:
            return []
        df["periodo"] = df["fecha_cosecha"].dt.strftime("%Y-%m")
        g = (df.groupby("periodo", as_index=False)
               .agg(total_cosechas=("id_harvest", "nunique"), kilos_optimos=("kilos_optimos", "sum"),
                    kilos_merma=("kilos_merma", "sum"), kilos_totales=("kilos_totales", "sum"))
               .sort_values("periodo"))
        return registros(g)

    # A5 — Tabla
    def por_responsable(self):
        df = self._detalle()
        g = (df.groupby("responsable", as_index=False)
               .agg(total_cosechas=("id_harvest", "nunique"), kilos_optimos=("kilos_optimos", "sum"),
                    kilos_merma=("kilos_merma", "sum"), kilos_totales=("kilos_totales", "sum"))
               .sort_values("kilos_totales", ascending=False))
        return registros(self._con_merma(g))

    # A6 — Rendimiento por parcela (persistencia políglota: SQL cultivos.id_parcela -> Mongo parcelas._id)
    def rendimiento_por_parcela(self):
        df = self._detalle()
        df = df[df["id_parcela"].notna()]
        g = (df.groupby("id_parcela", as_index=False)
               .agg(kilos_optimos=("kilos_optimos", "sum"), kilos_merma=("kilos_merma", "sum"),
                    kilos_totales=("kilos_totales", "sum")))
        parcelas = maestros_repo.parcelas()[["id", "nombre", "area_hectareas", "tipo_suelo"]]
        g = g.merge(parcelas, how="left", left_on="id_parcela", right_on="id").drop(columns=["id"])
        g["nombre"] = g["nombre"].fillna("Parcela no registrada en MongoDB")
        g["area_hectareas"] = g["area_hectareas"].fillna(0.0)
        g["rendimiento_kg_ha"] = [round(k / a, 2) if a else 0.0 for k, a in zip(g["kilos_optimos"], g["area_hectareas"])]
        g = g.rename(columns={"nombre": "parcela"}).sort_values("kilos_totales", ascending=False)
        return registros(self._con_merma(g))

    def seccion(self):
        return {
            "estudiante": "Ana Félix",
            "seccion": "Cosechas y Rendimiento",
            "cards": self.resumen(),
            "grafico_circular": self.calidad(),
            "grafico_barras": self.por_cultivo(),
            "serie_mensual": self.mensual(),
            "tabla": self.por_responsable(),
            "rendimiento_por_parcela": self.rendimiento_por_parcela(),
        }


cosechas_service = CosechasService()
