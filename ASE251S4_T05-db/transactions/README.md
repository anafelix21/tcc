# Operaciones Transaccionales ACID en MongoDB 8.0 — Agro Pacayales S.A.C.

Este directorio contiene la implementación práctica y scripts de demostración de transacciones multi-documento en MongoDB 8.0 para la empresa agroexportadora **Agro Pacayales S.A.C.** (Grupo 05).

---

## 📋 Estructura de Scripts Transaccionales

| Script | Casuística de Negocio | Conceptos Técnicos Demostrados |
| :--- | :--- | :--- |
| **`01_despacho_cosecha_transaccion.js`** | Despacho y venta internacional de Palto Hass con descuento atómico de stock en `cosechas` y generación de orden en `ordenes_despacho`. | `ClientSession`, `startTransaction`, Snapshot Isolation, verificación de invariantes, `commitTransaction` (camino feliz) y `abortTransaction` (saldo insuficiente). |
| **`02_asignacion_insumos_transaccion.js`** | Consumo y aplicación de insumos fitosanitarios (Bio-Fungicida) en parcelas agrícolas, afectando `insumos`, `fichas_campo` y `auditoria_labores`. | Transacciones multi-colección atómicas, reglas de dosificación, prevención de estados huérfanos o actualizaciones parciales. |
| **`03_simulacion_locks_write_conflict.js`** | Simulación en vivo de concurrencia entre dos transacciones que disputan la modificación del mismo documento de cosecha. | Bloqueo a nivel de documento (Document-Level Write Lock) en WiredTiger, Intent Exclusive (IX) lock, aislamiento MVCC sin dirty reads, captura de excepción `WriteConflict` (código 112) y patrón Retry Loop. |

---

## ⚙️ Requisitos de Ejecución en MongoDB

Las transacciones multi-documento en MongoDB requieren ejecutarse sobre:
1. **Un Replica Set** (mínimo de 1 nodo: `mongod --replSet rs0`).
2. **MongoDB Atlas** (clúster en la nube, donde todos los entornos vienen con Replica Set activo por defecto).
3. **Clúster Shardeado** (con router `mongos`).

> **Nota:** En instancias standalone puras sin Replica Set, MongoDB lanzará `Transaction numbers are only allowed on a replica set member or mongos`. Para pruebas locales, asegúrese de iniciar MongoDB con `--replSet rs0`.

---

## 🚀 Cómo Ejecutar los Scripts

### Opción A: Conectado a MongoDB Atlas (Cloud)
```bash
# Configurar la URL en .env o variable de entorno
export MONGODB_URL="mongodb+srv://admin:pass@cluster0.mongodb.net/agropacayales_db"

# Ejecutar la suite completa
./transactions/run_transactions.sh
```

### Opción B: Ejecutar un script individual con mongosh
```bash
mongosh "$MONGODB_URL" transactions/01_despacho_cosecha_transaccion.js
mongosh "$MONGODB_URL" transactions/02_asignacion_insumos_transaccion.js
mongosh "$MONGODB_URL" transactions/03_simulacion_locks_write_conflict.js
```

### Opción C: Ejecutar en contenedor Docker
```bash
docker compose exec -T mongodb mongosh --quiet < transactions/01_despacho_cosecha_transaccion.js
```
