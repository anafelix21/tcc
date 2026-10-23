# Persistencia Políglota — AgroPacayales (Gestión de Base de Datos)

## 1. ¿Qué base guarda qué?

| Motor | Rol | Dónde corre | Datos |
|---|---|---|---|
| **MongoDB** (puerto 27017) | **Maestros** (catálogos que cambian poco y tienen estructura flexible) + eventos | MongoDB Atlas / EC2 | `usuarios`, `insumos`, `parcelas`, `fichas_campo`, `eventos_negocio` |
| **SQL Server 2022** (puerto 1433) | **Transacciones** (cabecera–detalle, integridad referencial, ACID) | Amazon RDS (local: Docker) | `cultivos`, `actividad_cultivo` + `detalle_actividad`, `harvest` + `harvest_planting_cycle`, `asignacion_cabecera` + `asignacion_detalle` |

**Por qué así:** los maestros se consultan mucho y se enriquecen con subdocumentos (p. ej. `condiciones_edaficas` en parcelas), algo natural en documentos. Las transacciones necesitan claves foráneas, `ON DELETE CASCADE` y transacciones ACID entre cabecera y detalle, algo natural en un motor relacional.

### Clave compartida entre motores
SQL Server no puede tener una FK hacia MongoDB, así que el enlace es una **clave lógica**: una columna `VARCHAR(24)` que guarda el `_id` (ObjectId) del documento.

| Tabla SQL Server | Columna | Apunta a (MongoDB) |
|---|---|---|
| `cultivos` | `id_parcela` | `parcelas._id` |
| `detalle_actividad` | `id_insumo` | `insumos._id` |
| `asignacion_detalle` | `id_usuario` | `usuarios._id` |

La integridad de esa clave la garantiza la **capa de servicio** del Backend 1 (ver sección 3).

---

## 2. Versionamiento de la persistencia políglota

El repositorio `ASE251S4_T05-db` aplica *Database as Code*: cada cambio de esquema es un archivo versionado en Git y se aplica de forma ordenada y trazable en **ambos** motores.

```text
ASE251S4_T05-db/db/
├── sqlserver/
│   ├── bootstrap/V001_baseline.sql        # tablas, FKs, vista vw_resumen_operativo_cultivos, datos semilla
│   ├── changes/V002_auditoria_labores.sql  # tabla auditoria_actividades + trigger trg_auditar_actividades
│   ├── checks/contract.sql                 # verifica que la versión aplicada cumple el contrato
│   └── metadata/record-change.sql          # registra el cambio en dbo.schema_changes
└── mongodb/
    ├── bootstrap/V001__baseline.js          # colecciones + validadores $jsonSchema
    ├── changes/V002_modelado_estrategias.js # embedding (1:1, 1:Few) y subset pattern por integrante
    ├── checks/contract.js
    └── metadata/record-change.js            # registra el cambio en la colección schema_changes
```

### Reglas de versionamiento
1. **Nomenclatura `V###`**: el número define el orden de aplicación; nunca se edita un cambio ya aplicado, se crea uno nuevo.
2. **Historial en la propia base**: cada motor tiene su tabla/colección `schema_changes` con `sequence`, `change_id`, `checksum` (SHA-256 del archivo), `git_sha`, `release_version` y `applied_at`.
   - Si el checksum de un archivo ya aplicado cambia, el runner lo detecta como **conflicto** (alguien modificó historia).
3. **Contratos (`checks/`)**: después de aplicar, se valida que la versión V2 exige, p. ej., `condiciones_edaficas` en parcelas o `tabla_dosificacion_cultivo` en insumos.
4. **Versión simétrica**: SQL Server y MongoDB avanzan con la misma numeración (V001 baseline, V002 evolución), así el backend sabe qué versión de *ambos* motores espera (`release-manifest.json` del módulo `check/`).
5. **Automatización**: los workflows de GitHub Actions (`validate.yml`, `apply.yml`, `publish.yml`) validan, aplican y publican la imagen del runner; `demo/demo-versionamiento.sh` y `demo/demo-rollback.sh` muestran avance y reversa.

### Cómo explicarlo en la exposición
- Mostrar `dbo.schema_changes` en SQL Server y `schema_changes` en Mongo con las mismas versiones.
- Ejecutar `demo/demo-versionamiento.sh` (aplica V002) y `demo/demo-checker.sh` (verifica contrato).
- Mostrar `demo/demo-conflicto.sh`: si se altera un archivo ya aplicado, el checksum no coincide y el despliegue se detiene.

---

## 3. CRUD interactuando maestros (MongoDB) con transacciones (SQL Server)

Toda la lógica vive en el **Backend 1** (Spring WebFlux), que tiene dos repositorios reactivos: `repository/mongo` (Reactive MongoDB) y `repository/r2dbc` (R2DBC SQL Server), configurados en `config/DatabaseConfig.java`.

### 3.1 Registrar una actividad de cultivo (Hugo) — `POST /api/actividades-cultivos`
```text
Cliente ──► ActividadCultivoServiceImpl.crear()
   1. Por cada detalle: insumoRepo.findById(idInsumo)            [MongoDB]
        ├─ no existe  → 400 "El insumo ... no existe en MongoDB"
        └─ inactivo   → 400 "El insumo ... se encuentra inactivo"
   2. precio_unitario = insumo.precio (MongoDB), subtotal = precio × cantidad
   3. costo_total = Σ subtotales
   4. INSERT actividad_cultivo (cabecera)                         [SQL Server]
   5. INSERT detalle_actividad (id_insumo = _id de Mongo)          [SQL Server]
   (4 y 5 dentro de TransactionalOperator → si falla el detalle, se revierte la cabecera)
```
El **maestro** aporta validación y precio; la **transacción** guarda el hecho económico con el precio *congelado* al momento del registro (si mañana cambia el precio del insumo, la actividad histórica no cambia).

### 3.2 Asignar trabajadores (Axel) — `POST /api/asignaciones-trabajadores`
1. Valida que la actividad exista en SQL Server.
2. Valida cada `id_usuario` contra `usuarios` en MongoDB (existe y está activo).
3. Inserta `asignacion_cabecera` + `asignacion_detalle` y **suma el costo de mano de obra** al `costo_total` de `actividad_cultivo`, todo en la misma transacción SQL.

### 3.3 Registrar cosecha (Ana) — `POST /api/harvest`
Cabecera `harvest` + detalle `harvest_planting_cycle` (kilos óptimos y merma por cultivo) en una transacción; cada cultivo pertenece a una parcela de MongoDB (`cultivos.id_parcela`).

### 3.4 Reglas del maestro que protegen a las transacciones
| Operación en el maestro (MongoDB) | Efecto |
|---|---|
| Eliminar insumo (`PATCH /eliminar`) | Es **lógica** (`estado=false`, `deleted_at`), nunca física: los `detalle_actividad` históricos siguen apuntando a un `_id` válido. Además no se permite si el insumo tiene stock. |
| Restaurar (`PATCH /restaurar`) | `estado=true`, `restored_at`; vuelve a poder usarse en nuevas actividades. |
| Insumo/usuario inactivo | Las nuevas transacciones lo rechazan (paso 1 de 3.1 / 3.2). |
| Auditoría | Los maestros guardan `created_at`, `updated_at`, `deleted_at`, `restored_at`; en SQL Server el trigger `trg_auditar_actividades` (V002) registra cambios en `auditoria_actividades`. |

### 3.5 Lectura combinada (Backend 2 Analítico)
El Backend Analítico lee ambos motores y los **une con Pandas** por la clave compartida:
- `GET /api/v1/analytics/campo/insumos/consumo` → `detalle_actividad` (SQL) ⨝ `insumos` (Mongo) por `id_insumo = _id`.
- `GET /api/v1/analytics/personal/ranking-trabajadores` → `asignacion_detalle` (SQL) ⨝ `usuarios` (Mongo).
- `GET /api/v1/analytics/cosechas/rendimiento-parcela` → cosechas (SQL) ⨝ `parcelas` (Mongo) → kg/ha.

Si el `_id` no existe en Mongo, el resultado lo marca como *"no encontrado en MongoDB"*, lo que sirve para detectar inconsistencias entre los dos motores.
