import unittest
import json
from app.main import app

class TestBackendAnaliticoAgroPacayales(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.client.testing = True

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data.get("estado"), "Operativo")
        print("\n[OK] Health Check:", data.get("servicio"))

    def test_status_database(self):
        response = self.client.get("/status/database")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data.get("connected"))
        print("\n[OK] MongoDB Atlas:", data.get("database"), "| Colecciones:", data.get("collections"))

    def test_servicio_1_insumos_categoria(self):
        response = self.client.get("/analytics/presupuesto/insumos-categoria")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("presupuesto_total_insumos_pen", data)
        self.assertIn("detalle_por_categoria", data)
        self.assertIn("toma_de_decision", data)
        print(f"\n[OK] Servicio 1 (Hugo - Insumos): Total S/ {data.get('presupuesto_total_insumos_pen')}")
        print(f"     Mayor gasto: {data.get('categoria_con_mas_gasto')}")
        print(f"     Decisión: {data.get('toma_de_decision')[:80]}...")

    def test_servicio_2_parcelas_cultivo(self):
        response = self.client.get("/analytics/presupuesto/parcelas-cultivo")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("total_hectareas", data)
        self.assertIn("detalle_cultivos", data)
        self.assertIn("toma_de_decision", data)
        print(f"\n[OK] Servicio 2 (Axel - Parcelas): Total {data.get('total_hectareas')} ha")
        print(f"     Cultivo principal: {data.get('cultivo_con_mas_hectareas')}")

    def test_servicio_3_stock_critico(self):
        response = self.client.get("/analytics/presupuesto/stock-critico")
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn("presupuesto_total_necesario_pen", data)
        self.assertIn("insumos_a_comprar", data)
        self.assertIn("toma_de_decision", data)
        print(f"\n[OK] Servicio 3 (Ana Felix - Stock Crítico): Dinero para compras S/ {data.get('presupuesto_total_necesario_pen')}")
        print(f"     Decisión: {data.get('toma_de_decision')[:80]}...")

if __name__ == "__main__":
    unittest.main()
