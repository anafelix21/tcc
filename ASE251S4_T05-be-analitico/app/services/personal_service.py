"""Sección 3 — Axel Huapaya: Personal y Mano de Obra (SQL Server + MongoDB usuarios/parcelas)."""
import pandas as pd
from app.repositories.transacciones_repo import transacciones_repo
from app.repositories.maestros_repo import maestros_repo
from app.utils.dataframe import registros, porcentaje, numerico


class PersonalService:

    def _asignaciones(self):
        df = transacciones_repo.asignaciones_detalle()
        df = numerico(df, ["horas_trabajadas", "costo_total_mano_obra", "costo_mano_obra"])
        df["fecha_asignacion"] = pd.to_datetime(df["fecha_asignacion"], errors="coerce")
        df["tipo_actividad"] = df["tipo_actividad"].fillna("NO ESPECIFICADO").str.upper()
        return df

    @staticmethod
    def _cabeceras(df):
        """Horas y costo total están en la cabecera: se deduplican para no sumarlos dos veces."""
        return df.drop_duplicates(subset=["id_asignacion_cabecera"])

    # X1 — Cards
    def resumen(self):
        usuarios = maestros_repo.usuarios()
        cab = self._cabeceras(self._asignaciones())
        horas = float(cab["horas_trabajadas"].sum())
        costo = float(cab["costo_total_mano_obra"].sum())
        activos = int(usuarios["estado"].sum())
        return {
            "usuarios_registrados": int(len(usuarios)),
            "usuarios_activos": activos,
            "usuarios_inactivos": int(len(usuarios)) - activos,
            "total_asignaciones": int(len(cab)),
            "horas_trabajadas_totales": round(horas, 2),
            "costo_total_mano_obra": round(costo, 2),
            "costo_promedio_hora": round(costo / horas, 2) if horas else 0.0,
        }

    # X2 — Gráfico circular: personal activo por rol
    def por_rol(self):
        df = maestros_repo.usuarios()
        df = df[df["estado"]]
        g = df.groupby("rol", as_index=False).agg(total=("id", "count")).sort_values("total", ascending=False)
        g["porcentaje"] = [porcentaje(t, g["total"].sum()) for t in g["total"]]
        return registros(g)

    # X3 — Barras: costo de mano de obra por tipo de actividad
    def mano_obra_por_actividad(self):
        cab = self._cabeceras(self._asignaciones())
        g = (cab.groupby("tipo_actividad", as_index=False)
                .agg(asignaciones=("id_asignacion_cabecera", "count"),
                     horas=("horas_trabajadas", "sum"), costo=("costo_total_mano_obra", "sum"))
                .sort_values("costo", ascending=False))
        return registros(g)

    # X4 — Tabla: ranking de trabajadores (políglota: SQL asignacion_detalle.id_usuario -> Mongo usuarios._id)
    def ranking_trabajadores(self, top=10):
        df = self._asignaciones()
        df = df[df["id_usuario"].notna()]
        g = (df.groupby("id_usuario", as_index=False)
               .agg(asignaciones=("id_asignacion_detalle", "count"), costo_mano_obra=("costo_mano_obra", "sum")))
        usuarios = maestros_repo.usuarios()[["id", "nombre_completo", "rol", "correo"]]
        g = g.merge(usuarios, how="left", left_on="id_usuario", right_on="id").drop(columns=["id"])
        g["nombre_completo"] = g["nombre_completo"].fillna("Usuario no encontrado en MongoDB")
        g = g.rename(columns={"nombre_completo": "trabajador"})
        return registros(g.sort_values("costo_mano_obra", ascending=False).head(top))

    # X5 — Serie mensual de horas y costo
    def mensual(self):
        cab = self._cabeceras(self._asignaciones()).dropna(subset=["fecha_asignacion"])
        if cab.empty:
            return []
        cab = cab.assign(periodo=cab["fecha_asignacion"].dt.strftime("%Y-%m"))
        g = (cab.groupby("periodo", as_index=False)
                .agg(asignaciones=("id_asignacion_cabecera", "count"),
                     horas=("horas_trabajadas", "sum"), costo=("costo_total_mano_obra", "sum"))
                .sort_values("periodo"))
        return registros(g)

    # X6 — Distribución de parcelas (hectáreas por tipo de suelo) asignadas a responsables
    def parcelas_por_suelo(self):
        df = maestros_repo.parcelas()
        df = df[df["estado"]]
        g = (df.groupby("tipo_suelo", as_index=False)
               .agg(total_parcelas=("id", "count"), hectareas=("area_hectareas", "sum"),
                    en_uso=("en_uso", "sum"), produccion_estimada_kg=("produccion_estimada_kg", "sum"))
               .sort_values("hectareas", ascending=False))
        g["porcentaje_hectareas"] = [porcentaje(h, g["hectareas"].sum()) for h in g["hectareas"]]
        return registros(g)

    def seccion(self):
        return {
            "estudiante": "Axel Huapaya",
            "seccion": "Personal y Mano de Obra",
            "cards": self.resumen(),
            "grafico_circular": self.por_rol(),
            "grafico_barras": self.mano_obra_por_actividad(),
            "tabla": self.ranking_trabajadores(),
            "serie_mensual": self.mensual(),
            "parcelas_por_suelo": self.parcelas_por_suelo(),
        }


personal_service = PersonalService()
