"""Sección 2 — Hugo Fernández: Actividades de campo e Insumos (SQL Server + MongoDB insumos)."""
from app.repositories.transacciones_repo import transacciones_repo
from app.repositories.maestros_repo import maestros_repo
from app.utils.dataframe import registros, porcentaje, numerico


class ActividadesInsumosService:

    def _actividades(self):
        df = transacciones_repo.actividades()
        df = numerico(df, ["costo_total"])
        df["completado"] = df["completado"].fillna(False).astype(bool)
        df["tipo_actividad"] = df["tipo_actividad"].fillna("NO ESPECIFICADO").str.upper()
        return df

    def _insumos_activos(self):
        df = maestros_repo.insumos()
        return df[df["estado"]]

    # H1 — Cards de actividades
    def resumen_actividades(self):
        df = self._actividades()
        total = len(df)
        completadas = int(df["completado"].sum())
        return {
            "total_actividades": total,
            "actividades_completadas": completadas,
            "actividades_pendientes": total - completadas,
            "tasa_cumplimiento_pct": porcentaje(completadas, total),
            "costo_total_acumulado": round(float(df["costo_total"].sum()), 2),
            "costo_promedio_actividad": round(float(df["costo_total"].mean()), 2) if total else 0.0,
        }

    # H2 — Barras: costo y cumplimiento por tipo de actividad
    def actividades_por_tipo(self):
        df = self._actividades()
        g = (df.groupby("tipo_actividad", as_index=False)
               .agg(total=("id_actividad", "count"), completadas=("completado", "sum"),
                    costo_acumulado=("costo_total", "sum"))
               .sort_values("costo_acumulado", ascending=False))
        g["tasa_cumplimiento_pct"] = [porcentaje(c, t) for c, t in zip(g["completadas"], g["total"])]
        return registros(g)

    # H3 — Cards de inventario
    def resumen_insumos(self, limite_critico=20):
        df = self._insumos_activos()
        return {
            "total_insumos": int(len(df)),
            "stock_total_unidades": int(df["stock"].sum()),
            "valor_total_inventario": round(float(df["valor_inventario"].sum()), 2),
            "insumos_stock_critico": int((df["stock"] <= limite_critico).sum()),
            "precio_promedio": round(float(df["precio"].mean()), 2) if len(df) else 0.0,
        }

    # H4 — Gráfico circular: distribución por tipo
    def insumos_por_tipo(self):
        df = self._insumos_activos()
        g = (df.groupby("tipo_insumo", as_index=False)
               .agg(total_items=("id", "count"), stock_acumulado=("stock", "sum"),
                    valor_acumulado=("valor_inventario", "sum"))
               .sort_values("valor_acumulado", ascending=False))
        total = g["valor_acumulado"].sum()
        g["porcentaje_valor"] = [porcentaje(v, total) for v in g["valor_acumulado"]]
        return registros(g)

    # H5 — Tabla: stock crítico
    def stock_critico(self, limite=20):
        df = self._insumos_activos()
        df = df[df["stock"] <= limite].sort_values("stock")
        return registros(df[["id", "nombre", "tipo_insumo", "stock", "unidad_medida", "precio", "proveedor"]])

    # H6 — Consumo de insumos en campo (políglota: SQL detalle_actividad.id_insumo -> Mongo insumos._id)
    def consumo_insumos(self, top=10):
        consumo = transacciones_repo.consumo_insumos()
        consumo = numerico(consumo, ["cantidad", "subtotal"])
        g = (consumo.groupby("id_insumo", as_index=False)
                    .agg(cantidad_consumida=("cantidad", "sum"), gasto_total=("subtotal", "sum"),
                         veces_usado=("id_detalle", "count")))
        insumos = maestros_repo.insumos()[["id", "nombre", "tipo_insumo", "stock", "unidad_medida"]]
        g = g.merge(insumos, how="left", left_on="id_insumo", right_on="id").drop(columns=["id"])
        g["nombre"] = g["nombre"].fillna("Insumo no encontrado en MongoDB")
        g["stock"] = g["stock"].fillna(0)
        # Rotación = consumido / (consumido + stock actual)
        g["indice_rotacion_pct"] = [porcentaje(c, c + s) for c, s in zip(g["cantidad_consumida"], g["stock"])]
        return registros(g.sort_values("gasto_total", ascending=False).head(top))

    def seccion(self):
        return {
            "estudiante": "Hugo Fernández",
            "seccion": "Actividades de Campo e Insumos",
            "cards": {**self.resumen_actividades(), **self.resumen_insumos()},
            "grafico_circular": self.insumos_por_tipo(),
            "grafico_barras": self.actividades_por_tipo(),
            "tabla": self.stock_critico(),
            "consumo_insumos": self.consumo_insumos(),
        }


actividades_insumos_service = ActividadesInsumosService()
