# ASE251S4_T05-db — Agro Pacayales S.A.C.
**Plataforma de Persistencia Políglota con Liquibase y Operaciones Transaccionales en MongoDB 8.0**  
**Curso:** Persistencia Políglota y Gestión de Datos (ASE251S4) | **Equipo:** Grupo 05 (T05)  
**Propósito del Sistema:** Análisis de Rentabilidad, Trazabilidad Fitosanitaria y Transaccionalidad ACID para Agroexportación (Palto Hass y Arándanos).

---

## 👥 Equipo de Trabajo y Asignaciones Técnicas

| Integrante | Rol | Asignación Técnica | Entregables y Responsabilidades |
| :--- | :--- | :--- | :--- |
| **Hugo Fernández** | **DevOps / Líder Técnico** | Orquestación Docker, Runner de Despliegue, CI/CD GitHub Actions, Inspección Estática | Contratos V001 (`cultivos`/`parcelas`), V004 (`fichas_campo`), Dockerfile multi-stage, suite de pruebas `test-lab.sh`. |
| **Ana Félix** | **Database Developer (Relacional)** | Módulo Microsoft SQL Server 2022 / Relacional, Kardex de Insumos, Auditoría de Labores y Rollback | Contratos V001 (`baseline.sql`), V002 (`auditoria_labores.sql`), simulación de transacciones y reversión controlada. |
| **Axel Huapaya** | **Database Developer (NoSQL MongoDB)** | Módulo MongoDB, Validadores `$jsonSchema`, Modelado Documental y Transacciones ACID | Contrato V001 (`baseline.js`), V002 (`modelado_estrategias.js`), scripts transaccionales de despacho, consumo y simulación de locks/WriteConflict. |

---

## 📚 Documentación Técnica del Repositorio

* 🧪 **[Suite de Operaciones Transaccionales ACID en MongoDB](transactions/README.md):**  
  *Documentación de los 3 casos prácticos de transacciones multi-documento con `ClientSession`, `startTransaction`, `commitTransaction`, `abortTransaction` y simulación de `WriteConflict`.*
* 🚀 **[Guía de Scripts de Demostración y CLI](demo/README.md):**  
  *Manual de uso para `./demo/lab.sh`, `./demo/demo-versionamiento.sh`, resolución de conflictos y rollback.*

---

## 🏗️ 1. Arquitectura del Repositorio (Database-as-Code)

La arquitectura sigue el estándar determinista de persistencia políglota como código (**Microsoft SQL Server 2022 + MongoDB**), desacoplando los motores del ciclo de vida de los datos mediante contenedores y microservicios de diagnóstico:

```text
ASE251S4_T05-db/
├── .github/workflows/          # Automatización CI/CD con GitHub Actions
│   ├── validate.yml            # Quality Gate en Pull Requests (inspección y build)
│   ├── apply.yml               # Despliegue con aprobación en 'database-production'
│   ├── publish.yml             # Publicación de imagen runner multi-arch
│   └── publish-checker.yml     # Publicación de microservicio checker
├── .env.example                # Variables de configuración y credenciales cloud
├── .gitattributes              # Normalización LF obligatoria para Linux/Docker
├── compose.yaml                # Orquestación multi-contenedor (SQL Server + MongoDB + Checker)
├── docker/
│   └── liquibase/              # Runner reutilizable Liquibase Community
│       ├── Dockerfile          # Imagen con extensión liquibase-mongodb
│       └── pom.xml             # Driver sync, bson y mssql-jdbc
├── check/                      # Microservicio diagnóstico WebFlux (R2DBC SQL Server + Mongo Reactivo)
│   ├── Dockerfile              # Construcción multi-etapa en Java 21
│   ├── pom.xml                 # Spring Boot WebFlux + SpringDoc OpenAPI (/swagger-ui.html)
│   └── src/main/...            # Controladores y servicios de diagnóstico
├── db/
│   ├── sqlserver/              # Persistencia Relacional SQL Server 2022 (T-SQL)
│   │   ├── bootstrap/          # V001_baseline.sql (esquema inicial, tablas y semillas)
│   │   ├── changes/            # V002_auditoria_labores.sql (trigger y tabla de auditoría)
│   │   ├── checks/             # Verificación de contratos y objetos
│   │   └── metadata/           # Registro en dbo.schema_changes
│   └── mongodb/                # Persistencia NoSQL (JavaScript / Validadores $jsonSchema)
│       ├── bootstrap/          # V001__baseline.js
│       ├── changes/            # V002_modelado_estrategias.js (embedding y validadores)
│       ├── checks/             # contract.js
│       └── metadata/           # record-change.js
├── demo/                       # Suite de scripts interactivos de gestión y sustentación
│   ├── lab.sh                  # CLI unificada (inspect, build, validate, apply, history, etc.)
│   ├── demo-versionamiento.sh  # Demostración paso a paso guiada para la exposición
│   ├── demo-conflicto.sh       # Simulación de resolución de ramas concurrentes
│   ├── demo-rollback.sh        # Procedimiento de rollback controlado
│   └── demo-checker.sh         # Verificación observable de APIs REST y Swagger
├── tests/
│   ├── test-lab.sh             # Suite de pruebas automatizadas locales
│   └── check-release-diff.sh   # Calidad de inmutabilidad para Git diff
└── transactions/               # Suite práctica de Transacciones ACID en MongoDB 8.0
    ├── 01_despacho_cosecha_transaccion.js
    ├── 02_asignacion_insumos_transaccion.js
    ├── 03_simulacion_locks_write_conflict.js
    └── run_transactions.sh
```

---

## 🚀 2. Despliegue Rápido y Verificación Local

### Paso 1: Configurar variables de entorno
```bash
cp .env.example .env
# Completar credenciales de Microsoft SQL Server 2022 (Docker / Amazon RDS) y MongoDB (Atlas)
```

### Paso 2: Ejecutar scripts de inicialización SQL Server
```bash
# Aplica V001 (baseline) y V002 (auditoría)
docker exec -i agropacayales-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'AgroPacayales2026!' -C -d agropacayales_db -i /scripts/bootstrap/V001_baseline.sql
```

### Paso 3: Aplicar cambios de MongoDB
```bash
# Aplica validadores $jsonSchema y modelos embebidos
mongosh "mongodb+srv://..." db/mongodb/bootstrap/V001__baseline.js
mongosh "mongodb+srv://..." db/mongodb/changes/V002_modelado_estrategias.js
```

---

## 🔄 3. Contratos Versionados Simétricos (V001..V002)

| Versión | Capacidad del Negocio | Microsoft SQL Server 2022 (T-SQL) | MongoDB (JSON Schema / JS) | Autor |
| :--- | :--- | :--- | :--- | :--- |
| **V001** | Transacciones y Maestros Base | `cultivos`, `actividad_cultivo`, `harvest`, `asignacion` | `parcelas`, `insumos`, `usuarios` ($jsonSchema) | `hugo-fernandez` / `ana-felix` |
| **V002** | Auditoría y Modelado Avanzado | `auditoria_actividades` (trigger `trg_auditar_actividades`) | Embedding de suelo y riego en `parcelas`, kardex | `ana-felix` / `axel-huapaya` |


---

## 🧪 4. Ejecución de Transacciones ACID en MongoDB 8.0

Para ejecutar los 3 escenarios transaccionales prácticos:

```bash
# Otorgar permisos y ejecutar
chmod +x transactions/run_transactions.sh
./transactions/run_transactions.sh
```

Los scripts demuestran:
1. **Despacho Exportación:** Descuento atómico de fruta Cat Extra, inserción de orden comercial y rollback ante stock insuficiente.
2. **Consumo Fitosanitario:** Débito de bio-fungicida en `insumos`, adición de labor en `fichas_campo` y auditoría multi-colección.
3. **Bloqueos WiredTiger:** Demostración en vivo de *Document-Level Locking*, aislamiento *Snapshot* (sin dirty reads) y captura de excepción `WriteConflict` (código 112) con bucle de reintento.
