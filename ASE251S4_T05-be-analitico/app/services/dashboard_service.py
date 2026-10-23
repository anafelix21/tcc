"""Dashboard General: integra los indicadores más relevantes de las 3 secciones."""
from app.services.cosechas_service import cosechas_service
from app.services.actividades_insumos_service import actividades_insumos_service
from app.services.personal_service import personal_service


class DashboardService:

    def general(self):
        cos = cosechas_service.resumen()
        act = actividades_insumos_service.resumen_actividades()
        ins = actividades_insumos_service.resumen_insumos()
        per = personal_service.resumen()

        cards = {
            "kilos_cosechados": cos["kilos_totales"],
            "eficiencia_cosecha_pct": cos["eficiencia_cosecha_pct"],
            "valor_inventario": ins["valor_total_inventario"],
            "insumos_stock_critico": ins["insumos_stock_critico"],
            "tasa_cumplimiento_actividades_pct": act["tasa_cumplimiento_pct"],
            "costo_total_mano_obra": per["costo_total_mano_obra"],
            "usuarios_activos": per["usuarios_activos"],
        }
        # Distribución de costos operativos (circular): actividades vs mano de obra vs inventario
        costos = [
            {"categoria": "Actividades de campo", "monto": act["costo_total_acumulado"]},
            {"categoria": "Mano de obra", "monto": per["costo_total_mano_obra"]},
            {"categoria": "Inventario de insumos", "monto": ins["valor_total_inventario"]},
        ]
        return {
            "cards": cards,
            "grafico_circular": costos,
            "grafico_barras": cosechas_service.por_cultivo(),
            "tabla": actividades_insumos_service.consumo_insumos(top=5),
            "secciones": {
                "ana_felix_cosechas": cos,
                "hugo_fernandez_actividades_insumos": {**act, **ins},
                "axel_huapaya_personal": per,
            },
        }


dashboard_service = DashboardService()
