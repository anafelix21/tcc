from app.services.cosechas_service import cosechas_service
from app.services.actividades_service import actividades_service
from app.services.insumos_service import insumos_service
from app.services.parcelas_service import parcelas_service
from app.services.personal_service import personal_service

class DashboardService:

    def get_kpis_consolidados(self):
        cosechas = cosechas_service.get_resumen()
        actividades = actividades_service.get_resumen()
        insumos = insumos_service.get_resumen()
        parcelas = parcelas_service.get_resumen()
        personal = personal_service.get_resumen()

        return {
            "agricola": {
                "total_parcelas": parcelas.get("total_parcelas", 0),
                "hectareas_totales": parcelas.get("hectareas_totales", 0.0),
                "parcelas_en_uso": parcelas.get("parcelas_en_uso", 0),
                "produccion_estimada_kg": parcelas.get("produccion_estimada_total_kg", 0.0)
            },
            "calidad_cosechas": {
                "total_cosechas": cosechas.get("total_cosechas", 0),
                "kilos_optimos": cosechas.get("kilos_optimos", 0.0),
                "kilos_merma": cosechas.get("kilos_merma", 0.0),
                "kilos_totales": cosechas.get("kilos_totales", 0.0),
                "tasa_merma_pct": cosechas.get("tasa_merma_pct", 0.0),
                "eficiencia_cosecha_pct": cosechas.get("eficiencia_cosecha_pct", 100.0)
            },
            "operaciones_campo": {
                "total_actividades": actividades.get("total_actividades", 0),
                "actividades_completadas": actividades.get("actividades_completadas", 0),
                "actividades_pendientes": actividades.get("actividades_pendientes", 0),
                "tasa_cumplimiento_pct": actividades.get("tasa_cumplimiento_pct", 0.0),
                "costo_acumulado_actividades": actividades.get("costo_total_acumulado", 0.0)
            },
            "inventario_insumos": {
                "total_insumos": insumos.get("total_insumos", 0),
                "stock_total_unidades": insumos.get("stock_total_unidades", 0),
                "valor_total_inventario": insumos.get("valor_total_inventario", 0.0),
                "insumos_stock_critico": insumos.get("insumos_stock_critico", 0)
            },
            "recursos_humanos": {
                "usuarios_activos": personal.get("usuarios", {}).get("usuarios_activos", 0),
                "horas_trabajadas": personal.get("mano_obra", {}).get("horas_trabajadas_totales", 0.0),
                "costo_total_mano_obra": personal.get("mano_obra", {}).get("costo_total_mano_obra", 0.0)
            }
        }

dashboard_service = DashboardService()
