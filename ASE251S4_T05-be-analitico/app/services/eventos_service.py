"""Ingesta y procesamiento de eventos de negocio / logs enviados por el Backend 1."""
from app.repositories.eventos_repo import eventos_repo
from app.utils.dataframe import registros


class EventosService:

    def ingestar(self, evento_in):
        return eventos_repo.guardar(evento_in.a_documento())

    def ingestar_lote(self, lote_in):
        return [self.ingestar(e) for e in lote_in.eventos]

    def resumen(self):
        df = eventos_repo.listar()
        por_tipo = df.groupby("tipo_evento", as_index=False).agg(total=("id", "count")).sort_values("total", ascending=False)
        por_entidad = df.groupby("entidad", as_index=False).agg(total=("id", "count")).sort_values("total", ascending=False)
        df_fechas = df.dropna(subset=["fecha_evento"])
        por_dia = []
        if not df_fechas.empty:
            df_fechas = df_fechas.assign(dia=df_fechas["fecha_evento"].dt.strftime("%Y-%m-%d"))
            por_dia = registros(df_fechas.groupby("dia", as_index=False).agg(total=("id", "count")).sort_values("dia"))
        return {
            "total_eventos": int(len(df)),
            "por_tipo_evento": registros(por_tipo),
            "por_entidad": registros(por_entidad),
            "por_dia": por_dia,
        }

    def ultimos(self, top=20):
        df = eventos_repo.listar().sort_values("fecha_evento", ascending=False).head(top)
        return registros(df)


eventos_service = EventosService()
