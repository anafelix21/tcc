# Suite de Demostración y CLI — Agro Pacayales S.A.C. (Grupo 05)

Esta carpeta contiene los scripts interactivos y utilitarios desarrollados para la gestión del ciclo de vida de persistencia políglota con Liquibase y la sustentación del video demostrativo:

---

## 🚀 1. CLI Unificada: `./demo/lab.sh`

La interfaz principal para desarrolladores y operadores:

```bash
# Inspección local sin credenciales ni red (comprueba orden VNNN, paridad e inmutabilidad)
./demo/lab.sh inspect

# Construir la imagen runner de Liquibase con extensiones oficiales
./demo/lab.sh build

# Validar conexiones y sintaxis de changelogs en PostgreSQL y MongoDB
./demo/lab.sh validate all

# Consultar cambios pendientes de aplicar (status detallado)
./demo/lab.sh status all

# Aplicar cambios pendientes con confirmación obligatoria 'APLICAR'
./demo/lab.sh apply all

# Consultar el historial auditado en DATABASECHANGELOG
./demo/lab.sh history all

# Crear una nueva versión V(n+1) equivalente en SQL y MongoDB XML
./demo/lab.sh create empaque axel-huapaya

# Recorrido guiado paso a paso para la exposición
./demo/lab.sh presentation
```

---

## 🎬 2. Guion Ejecutable por Fases: `./demo/demo-versionamiento.sh`

Diseñado para sincronizarse con las diapositivas del video demostrativo:

```bash
# Fase 1: Contexto inicial y contratos aplicados
./demo/demo-versionamiento.sh context

# Fase 2: Creación de nueva capacidad (V006)
./demo/demo-versionamiento.sh create empaque

# Fase 3: Quality gate local y validación cloud
./demo/demo-versionamiento.sh validate

# Fase 4: Aplicación controlada a producción
./demo/demo-versionamiento.sh apply

# Fase 5: Evidencia de no-op e idempotencia
./demo/demo-versionamiento.sh evidence

# Fase 6: Entrega en Git para revisión por pares (PR)
./demo/demo-versionamiento.sh publish

# Fase 7: Sincronización e imagen inmutable de CI
./demo/demo-versionamiento.sh sync
```

---

## 🔄 3. Simulaciones Avanzadas

### Resolución Determinista de Conflictos en Ramas Concurrentes
```bash
./demo/demo-conflicto.sh
```
*Simula dos células de trabajo que crearon simultáneamente la misma versión V006 en ramas separadas y demuestra cómo se integra una y se recalcula la segunda a V007 sin tocar versiones ya publicadas.*

### Rollback Controlado
```bash
./demo/demo-rollback.sh plan V004
./demo/demo-rollback.sh apply V004
./demo/demo-rollback.sh evidence V004
./demo/demo-rollback.sh restore V004
```
*Ejecuta de manera segura las instrucciones de reversión declaradas en los propios changesets sin retroceder commits en Git.*

### Diagnóstico de APIs REST y Swagger
```bash
./demo/demo-checker.sh presentation
```
*Inicia el microservicio reactivo Spring Boot WebFlux y valida los endpoints `/api/diagnostics`, `/api/changes` y `/api/contract` en `http://localhost:8080/swagger-ui.html`.*

---

## 🧪 4. Pruebas Transaccionales en MongoDB 8.0

Para ejecutar la suite de transacciones ACID (Despacho, Consumo Fitosanitario y Bloqueos WiredTiger con WriteConflict):

```bash
./transactions/run_transactions.sh
```
Consulte la documentación detallada en [`transactions/README.md`](../transactions/README.md).
