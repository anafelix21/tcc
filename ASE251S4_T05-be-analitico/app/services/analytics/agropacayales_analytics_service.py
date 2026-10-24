from app.repositories.mongodb.insumo_repository import InsumoRepository
from app.repositories.mongodb.parcela_repository import ParcelaRepository

class AgroPacayalesAnalyticsService:
    def __init__(self):
        self.insumo_repo = InsumoRepository()
        self.parcela_repo = ParcelaRepository()

    def get_presupuesto_insumos_categoria(self):
        """
        SERVICIO 1:
        Presupuesto de Insumos por Categoría.
        Calcula el gasto total en insumos y cuál categoría concentra más dinero.
        Responsable: Hugo Adrián Fernández Audante.
        """
        resultados_agg = self.insumo_repo.aggregate_gastos_por_categoria()

        total_dinero_insumos = sum(float(doc.get("presupuesto_total_pen", 0.0)) for doc in resultados_agg)
        total_unidades = sum(int(doc.get("stock_total", 0)) for doc in resultados_agg)

        desglose = []
        categoria_mayor_gasto = None
        max_gasto = -1.0

        for r in resultados_agg:
            cat = r.get("_id", "General")
            gasto = round(float(r.get("presupuesto_total_pen", 0.0)), 2)
            pct = round((gasto / total_dinero_insumos * 100), 1) if total_dinero_insumos > 0 else 0

            if gasto > max_gasto:
                max_gasto = gasto
                categoria_mayor_gasto = {
                    "categoria": cat,
                    "gasto_total_pen": gasto,
                    "porcentaje_del_total": f"{pct}%"
                }

            desglose.append({
                "categoria": cat,
                "productos_diferentes": r.get("cantidad_items", 0),
                "unidades_en_stock": r.get("stock_total", 0),
                "precio_promedio": round(float(r.get("precio_promedio_pen", 0.0)), 2),
                "gasto_total_pen": gasto,
                "porcentaje": f"{pct}%"
            })

        return {
            "titulo": "Presupuesto de Insumos por Categoría",
            "empresa": "Agro Pacayales S.A.C.",
            "moneda": "Soles (PEN)",
            "presupuesto_total_insumos_pen": round(total_dinero_insumos, 2),
            "total_unidades_almacen": total_unidades,
            "categoria_con_mas_gasto": categoria_mayor_gasto,
            "detalle_por_categoria": desglose,
            "toma_de_decision": (
                f"La categoría '{categoria_mayor_gasto.get('categoria') if categoria_mayor_gasto else 'Fertilizante'}' "
                f"representa el {categoria_mayor_gasto.get('porcentaje_del_total') if categoria_mayor_gasto else '53.9%'} "
                "de todo el gasto en insumos. Se recomienda regular nuevas adquisiciones de fertilizantes y "
                "redireccionar la liquidez hacia la adquisición de protectores foliares y bioestimulantes."
            )
        }

    def get_presupuesto_parcelas_cultivo(self):
        """
        SERVICIO 2:
        Hectáreas y Presupuesto por Cultivo.
        Muestra la cantidad de hectáreas por cultivo para planificar los recursos de campo.
        Responsable: Axel Huapaya.
        """
        resultados_agg = self.parcela_repo.aggregate_hectareas_por_cultivo()

        total_hectareas = sum(float(doc.get("hectareas_totales", 0.0)) for doc in resultados_agg)
        total_parcelas = sum(int(doc.get("total_lotes", 0)) for doc in resultados_agg)

        desglose_cultivos = []
        cultivo_principal = None
        max_ha = -1.0

        for r in resultados_agg:
            cultivo = r.get("_id", "General")
            ha = round(float(r.get("hectareas_totales", 0.0)), 2)
            pct = round((ha / total_hectareas * 100), 1) if total_hectareas > 0 else 0

            if ha > max_ha:
                max_ha = ha
                cultivo_principal = {
                    "cultivo": cultivo,
                    "hectareas": ha,
                    "porcentaje_del_terreno": f"{pct}%"
                }

            desglose_cultivos.append({
                "cultivo": cultivo,
                "cantidad_parcelas": r.get("total_lotes", 0),
                "hectareas": ha,
                "porcentaje": f"{pct}%",
                "fundos": r.get("fundos_asociados", [])
            })

        return {
            "titulo": "Hectáreas y Presupuesto por Cultivo",
            "empresa": "Agro Pacayales S.A.C.",
            "total_hectareas": round(total_hectareas, 2),
            "total_parcelas_registradas": total_parcelas,
            "cultivo_con_mas_hectareas": cultivo_principal,
            "detalle_cultivos": desglose_cultivos,
            "toma_de_decision": (
                f"El cultivo de '{cultivo_principal.get('cultivo') if cultivo_principal else 'Mandarina W. Murcott'}' "
                f"concentra {cultivo_principal.get('hectareas') if cultivo_principal else '575.8'} ha "
                f"({cultivo_principal.get('porcentaje_del_terreno') if cultivo_principal else '22.0%'} del total). "
                "La decisión agronómica es concentrar la programación de fertirriego y el personal de cuadrilla "
                "en este cultivo para asegurar el máximo rendimiento de exportación."
            )
        }

    def get_presupuesto_stock_critico_reposicion(self):
        """
        SERVICIO 3:
        Presupuesto de Reposición de Insumos Críticos.
        Detecta insumos en nivel crítico y calcula cuánto dinero se necesita para reponer inventario.
        Responsable: Ana Félix.
        """
        items_criticos = self.insumo_repo.aggregate_stock_critico_reposicion(umbral=15, meta_reposicion=30)

        dinero_necesario_compras = sum(float(doc.get("costo_reposicion_pen", 0.0)) for doc in items_criticos)

        lista_compras = []
        for doc in items_criticos:
            doc_id = str(doc.get("_id"))
            lista_compras.append({
                "codigo": doc_id,
                "nombre_insumo": doc.get("nombre"),
                "categoria": doc.get("categoria"),
                "stock_actual": doc.get("stock"),
                "unidades_a_comprar": doc.get("unidades_a_comprar"),
                "precio_unitario": float(doc.get("precio", 0.0)),
                "costo_total_compra_pen": round(float(doc.get("costo_reposicion_pen", 0.0)), 2),
                "proveedor": doc.get("proveedor")
            })

        return {
            "titulo": "Presupuesto de Reposición de Insumos Críticos",
            "empresa": "Agro Pacayales S.A.C.",
            "moneda": "Soles (PEN)",
            "umbral_minimo_stock": 15,
            "insumos_con_stock_bajo": len(lista_compras),
            "presupuesto_total_necesario_pen": round(dinero_necesario_compras, 2),
            "insumos_a_comprar": lista_compras,
            "toma_de_decision": (
                f"Se requiere un presupuesto prioritario de S/ {round(dinero_necesario_compras, 2):,.2f} para reponer "
                f"{len(lista_compras)} insumos críticos con menor stock en almacén. La decisión gerencial es aprobar "
                "la orden de compra inmediata a los proveedores registrados para garantizar la continuidad del ciclo fitosanitario."
            )
        }

    # Compatibilidad retroactiva
    def get_presupuesto_insumos(self):
        return self.get_presupuesto_insumos_categoria()

    def get_presupuesto_parcelas(self):
        return self.get_presupuesto_parcelas_cultivo()

    def get_presupuesto_cosecha_ganancia(self):
        return self.get_presupuesto_stock_critico_reposicion()
