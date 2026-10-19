# ASE251S4_T05-db — Agro Pacayales S.A.C.
**Plataforma de Persistencia Políglota con Liquibase y Operaciones Transaccionales en MongoDB 8.0**  
**Curso:** Persistencia Políglota y Gestión de Datos (ASE251S4) | **Equipo:** Grupo 05 (T05)  
**Propósito del Sistema:** Análisis de Rentabilidad, Trazabilidad Fitosanitaria y Transaccionalidad ACID para Agroexportación (Palto Hass y Arándanos).

---

## 👥 Equipo de Trabajo y Asignaciones Técnicas

| Integrante | Rol | Asignación Técnica | Entregables y Responsabilidades |
| :--- | :--- | :--- | :--- |
| **Hugo Fernández** | **DevOps / Líder Técnico** | Orquestación Docker, Runner Liquibase 4.33.0, CI/CD GitHub Actions, Inspección Estática | Contratos V001 (`cultivos`/`parcelas`), V004 (`fichas_campo`), Dockerfile multi-stage, suite de pruebas `test-lab.sh`. |
| **Ana Félix** | **Database Developer (Relacional)** | Módulo PostgreSQL / Relacional, Kardex de Insumos, Auditoría de Labores y Rollback | Contratos V002 (`insumos_kardex`), V005 (`auditoria_labores`), simulación de conflictos y reversión controlada. |
| **Axel Huapaya** | **Database Developer (NoSQL MongoDB)** | Módulo MongoDB 8.0, Validadores `$jsonSchema`, Extensión Oficial XML y Transacciones ACID | Contrato V003 (`cosechas_lote`/`cosechas`), scripts transaccionales de despacho, consumo y simulación de locks/WriteConflict. |

---

## 📚 Documentación Técnica del Repositorio

* 🧪 **[Suite de Operaciones Transaccionales ACID en MongoDB](transactions/README.md):**  
  *Documentación de los 3 casos prácticos de transacciones multi-documento con `ClientSession`, `startTransaction`, `commitTransaction`, `abortTransaction` y simulación de `WriteConflict`.*
* 🚀 **[Guía de Scripts de Demostración y CLI](demo/README.md):**  
  *Manual de uso para `./demo/lab.sh`, `./demo/demo-versionamiento.sh`, resolución de conflictos y rollback.*

---

## 🏗️ 1. Arquitectura del Repositorio (Database-as-Code)

La arquitectura sigue el estándar determinista de persistencia como código, desacoplando los motores del ciclo de vida de los datos mediante contenedores runner efímeros y un microservicio de diagnóstico reactivo:

```text
ASE251S4_T05-db/
├── .github/workflows/          # Automatización CI/CD con GitHub Actions
│   ├── validate.yml            # Quality Gate en Pull Requests (inspección y build)
│   ├── apply.yml               # Despliegue con aprobación en 'database-production'
│   ├── publish.yml             # Publicación de imagen runner Liquibase multi-arch
│   └── publish-checker.yml     # Publicación de microservicio checker
├── .env.example                # Variables de configuración y credenciales cloud
├── .gitattributes              # Normalización LF obligatoria para Linux/Docker
├── compose.yaml                # Orquestación multi-contenedor (Runners Liquibase + Checker)
├── docker/
│   └── liquibase/              # Runner reutilizable Liquibase Community 4.33.0
│       ├── Dockerfile          # Imagen con extensión liquibase-mongodb 4.33.0.1
│       └── pom.xml             # Driver sync 5.5.1, bson y jackson
├── check/                      # Microservicio diagnóstico WebFlux (R2DBC + Mongo Reactivo)
│   ├── Dockerfile              # Construcción multi-etapa en Java 21
│   ├── pom.xml                 # Spring Boot WebFlux + SpringDoc OpenAPI (/swagger-ui.html)
│   └── src/main/...            # Controladores y servicios de diagnóstico
├── db/
│   ├── postgresql/             # Persistencia Relacional (Formatted SQL)
│   │   ├── changelog.xml       # Changelog maestro con inclusión secuencial
│   │   └── changes/            # Changesets V001..V005 con rollback
│   └── mongodb/                # Persistencia NoSQL (Extensión Oficial XML)
│       ├── changelog.xml       # Changelog maestro con inclusión secuencial
│       └── changes/            # Changesets V001..V005 con validadores $jsonSchema
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
# Completar credenciales de PostgreSQL (Aiven) y MongoDB (Atlas)
```

### Paso 2: Ejecutar inspección estática local
```bash
./demo/lab.sh inspect
```

### Paso 3: Ejecutar suite de pruebas de integridad
```bash
./tests/test-lab.sh
```

### Paso 4: Construir runner y consultar estado
```bash
./demo/lab.sh build
./demo/lab.sh status all
```

### Paso 5: Aplicar cambios a las bases de datos
```bash
./demo/lab.sh apply all
```

---

## 🔄 3. Contratos Versionados Simétricos (V001..V005)

| Versión | Capacidad del Negocio | PostgreSQL (SQL DDL) | MongoDB (XML `$jsonSchema`) | Autor |
| :--- | :--- | :--- | :--- | :--- |
| **V001** | Cultivos y Parcelas | `cultivos` (ID, variedad, hectáreas, fecha_siembra) | `parcelas` (GeoJSON, edáficas, riego) | `hugo-fernandez` |
| **V002** | Kardex de Insumos | `insumos_kardex` (SKU, tipo, stock, precio) | `insumos` (tabla_dosificacion embebida) | `ana-felix` |
| **V003** | Lotes de Cosecha | `cosechas_lote` (lote, FK cultivo, kilos) | `cosechas` (desgloseCalidades, laboratorio) | `axel-huapaya` |
| **V004** | Fichas de Campo | `fichas_campo` (visitas, evaluador, estado) | `fichas_campo` (GlobalGAP, plagas) | `hugo-fernandez` |
| **V005** | Auditoría de Labores | `auditoria_labores` (entidad, acción, usuario) | `auditoria_labores` (trazabilidad legal) | `ana-felix` |

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
