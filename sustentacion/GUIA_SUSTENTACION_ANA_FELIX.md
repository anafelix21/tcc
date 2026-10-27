# 🎓 Guía de Sustentación — Ana Félix Mendoza (Equipo T05 · AgroPacayales S.A.C.)

Guía para estudiar la **Evaluación del Proyecto Web y Móvil (20 puntos)**. Por cada criterio dice **cómo lo cumplo**, **qué decir** y **qué comando ejecutar para demostrarlo**.

> ✅ **Todos los comandos y resultados de esta guía se probaron** contra las imágenes reales del proyecto (Backend 1, Backend 2) con SQL Server 2022 y MongoDB 8 cargados con los scripts del equipo.
> 📎 JSON de los 3 maestros: [`JSON_MAESTROS_SWAGGER.md`](JSON_MAESTROS_SWAGGER.md) · CSV corregidos para importar: [`csv/`](csv/) · App móvil conectada a la nube + Git en otra PC: [`MANUAL_APP_MOVIL_Y_GIT.md`](MANUAL_APP_MOVIL_Y_GIT.md)

---

## 0. Lo mío en una tabla (memorizar)

| Curso | Mi parte (Ana Félix) | Dónde está |
| :-- | :-- | :-- |
| Talleres de Software Empresarial | **Maestro CRUD Parcelas** (MongoDB, colección `plots`) | `ASE251S4_T05-be` → `/api/parcelas` |
| Gestión de Base de Datos | **Transacción Cosechas** (SQL Server: `harvest` + `harvest_planting_cycle`) + changesets Liquibase **V002** y **V005** | `/api/harvest` · repo `ASE251S4_T05-db` |
| Proyectos de Innovación Tecnológica | **Sección 1 del dashboard: Cosechas y Rendimiento** (6 indicadores A1–A6) + **Servicio 3: reposición de stock crítico** | `ASE251S4_T05_ba` → `/api/v1/analytics/cosechas/...` |
| Desarrollo de Aplicaciones Móviles | App móvil (maestros, transacciones, cosechas) | `ASE251S4_T05-mo` |
| Cloud Computing / Orquestadores | Despliegue completo en AWS con **user data** (Kubernetes y Taller) | `despliegue-aws/` y `despliegue-taller-cloud/` |

> **Frase para empezar:** "Yo soy Ana Félix. Me encargué del maestro **Parcelas** en MongoDB, de la transacción **Cosechas** en SQL Server, de la **sección Cosechas del dashboard** con 6 indicadores y del **servicio de reposición de stock crítico**. Además automaticé el **despliegue en AWS** con un user data que levanta todo solo."

---

## 1. Criterios de admisibilidad (revisar antes de entrar)

Sin estos no se califica. **No están en el código: confírmalos con tu equipo.**

- [ ] Plan de acción actualizado hasta el Sprint 08
- [ ] Carpetas de Drive actualizadas hasta el Sprint 08
- [ ] Actas de reuniones realizadas
- [ ] Proyectos unificados e integrados → ✅ frontend, backend, backend analítico y móvil usan **las mismas bases** y se comunican entre sí

---

## 2. ⚙️ Preparar la terminal (hacer UNA vez antes de demostrar)

### 2.1 Kubernetes → entrar a `k8s-master`
**EC2 → `k8s-master` → Connect → EC2 Instance Connect → Connect** y pegar:
```bash
NS=agropacayales-namespace
R=$(kubectl -n $NS get cm agropacayales-config -o jsonpath='{.data.SQL_HOST}')
B1=http://localhost:30001; B2=http://localhost:30002
S(){ sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -W -s '|' -Q "SET NOCOUNT ON; $1"; }
echo "RDS=$R"
```
> El endpoint de RDS se lee del **ConfigMap** del clúster (así se demuestra también que los pods lo reciben por configuración).

### 2.2 Taller Cloud → entrar a `cc-backends`
```bash
R=$(aws rds describe-db-instances --query "DBInstances[?DBInstanceIdentifier=='cc-taller-rds-sqlserver']|[0].Endpoint.Address" --output text)
B1=http://localhost:8081; B2=http://localhost:5000
S(){ sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -W -s '|' -Q "SET NOCOUNT ON; $1"; }
echo "RDS=$R"
```

### 2.3 MongoDB → entrar a `ec2-mongodb` (Kubernetes) o `cc-mongodb` (Taller)
```bash
mongosh "mongodb://admin:Mongo12345@localhost:27017/agropacayales_db?authSource=admin"
```
(Desde tu PC también sirve **MongoDB Compass** con la IP pública; desde SSMS para SQL Server.)

### 2.4 Fechas de usuarios en MongoDB (solo para despliegues antiguos)
✅ **Ya corregido en los scripts de datos** (commit `8665dd9`): en todo despliegue **nuevo** (Kubernetes o Taller) el validador de `users` acepta las fechas como texto **o** fecha, y registrar/importar usuarios funciona sin hacer nada.

Solo si tu MongoDB se creó **antes** de esa corrección (error `Document failed validation` en `fecha_nacimiento`), dentro de `mongosh` pegar:
```js
const v = db.getCollectionInfos({name:"users"})[0].options.validator;
v.$jsonSchema.properties.fecha_nacimiento.bsonType = ["string","date"];
v.$jsonSchema.properties.fecha_contratacion.bsonType = ["string","date"];
db.runCommand({collMod:"users", validator:v});
```
✅ Probado: antes `importados: 0 / 12` → después `importados: 12 / 12`. (No toca código: solo amplía la regla de la base.)

---

## 3. Rutas de Ana Félix (para la demo)

**Puertos según el despliegue:**

| Componente | Kubernetes (orquestadores) | Taller Cloud Computing |
| :-- | :-- | :-- |
| Backend 1 (Spring Boot) | `http://<IP k8s-node-backend>:30001` | `http://<IP cc-backends>:8081` |
| Backend 2 Analítico (Flask) | `http://<IP k8s-node-backendAnalitico>:30002` | `http://<IP cc-backends>:5000` |
| Frontend | `http://<IP k8s-node-frontend>:30000` | `http://agropacayales-frontend-<cuenta>.s3-website-us-east-1.amazonaws.com` |
| Swagger Backend 1 | `…:30001/swagger-ui.html` | `…:8081/swagger-ui.html` |
| Swagger Backend 2 | `…:30002/apidocs/` | `…:5000/apidocs/` |

### 3.1 Maestro Parcelas — MongoDB (Backend 1, grupo **Parcela-Controller**)

| Acción | Método y ruta |
| :-- | :-- |
| Listar | `GET /api/parcelas` |
| Listar por estado (activas / eliminadas) | `GET /api/parcelas/estado/true` · `GET /api/parcelas/estado/false` |
| Buscar por id | `GET /api/parcelas/{id}` |
| **Registrar** | `POST /api/parcelas` |
| **Editar** | `PUT /api/parcelas/{id}` |
| **Eliminar** (lógico) | `PATCH /api/parcelas/{id}/eliminar` |
| **Restaurar** | `PATCH /api/parcelas/{id}/restaurar` |
| **Importar CSV / Excel** | `POST /api/parcelas/importar/csv` · `/importar/excel` (campo `file`) |
| **Exportar Excel / PDF** | `GET /api/parcelas/exportar/excel` · `/exportar/pdf` |

### 3.2 Transacción Cosechas — SQL Server (Backend 1, grupo **Harvest-Controller**)

| Acción | Método y ruta |
| :-- | :-- |
| Listar | `GET /api/harvest` |
| Buscar por id | `GET /api/harvest/{id}` |
| Registrar (cabecera + detalles) | `POST /api/harvest` |
| Editar | `PUT /api/harvest/{id}` |
| Eliminar (lógico) | `PUT /api/harvest/eliminar/{id}` |
| Restaurar | `PUT /api/harvest/restaurar/{id}` |

### 3.3 Mis 6 indicadores — Sección 1: Cosechas y Rendimiento (Backend 2, grupo **Ana Félix - Cosechas**)

Prefijo: `/api/v1/analytics/cosechas`

| # | Indicador | Ruta | Gráfico | Cómo se calcula | Resultado probado |
| :-: | :-- | :-- | :-- | :-- | :-- |
| A1 | Resumen de cosechas | `/resumen` | **Cards** | Total cosechas, kilos óptimos, merma, totales, % merma y % eficiencia | 60 cosechas · 569 190 kg · eficiencia **97.51 %** |
| A2 | Calidad: óptimo vs merma | `/calidad` | **Circular** | Kilos y % óptimo (exportable) frente a merma | 97.51 % / 2.49 % |
| A3 | Producción y merma por cultivo | `/por-cultivo` | **Barras** | `groupby("cultivo")` → suma de kilos y tasa de merma | |
| A4 | Evolución mensual | `/mensual` | Línea | `groupby("periodo")` → cosechas y kilos por mes | |
| A5 | Desempeño por responsable | `/por-responsable` | **Tabla** | `groupby("responsable")` → kilos y % merma | |
| A6 | Rendimiento kg/ha por parcela | `/rendimiento-parcela` | Barras | **kilos óptimos (SQL Server) ÷ hectáreas de la parcela (MongoDB)** | `PARC-LOM-019`: 17 550 kg ÷ 20.65 ha = **849.88 kg/ha** |
| — | Sección completa | `/seccion` | Dashboard | Cards + circular + barras + tabla | |

### 3.4 Servicio 3 — Reposición de insumos críticos
`GET /api/v1/analytics/presupuesto/stock-critico` → probado: **7 insumos críticos · S/ 34 002.00**

### 3.5 Salud y conexión
| Ruta | Para qué |
| :-- | :-- |
| `GET /health` (Backend 2) | El servicio está vivo |
| `GET /status/database` (Backend 2) | Conexión a SQL Server y MongoDB |
| `GET /api/v1/analytics/dashboard/general` | Dashboard general del equipo |

---

## 4. Criterios por curso: cómo cumplo + 🖥️ comandos para demostrar

### ☁️ Taller de Cloud Computing (3.5 pts)

| Criterio | Pts | Cómo lo cumplo | Evidencia en la consola |
| :-- | :-: | :-- | :-- |
| 2 BD con 2 servicios diferentes de AWS | 1 | **SQL Server en Amazon RDS** (`cc-taller-rds-sqlserver`, 1433) + **MongoDB en Amazon EC2** (`cc-mongodb`, 27017) | RDS → Databases · EC2 → Instances |
| 2 BE con mínimo 1 servicio de AWS | 1 | Backend 1 y Backend 2 en **Docker sobre Amazon EC2** (`cc-backends`, 8081 y 5000) | EC2 → `cc-backends` |
| FE con 1 servicio diferente | 0.5 | Frontend React en **Amazon S3** (Static website hosting) | S3 → bucket → Properties |
| Mín. 4 servicios diferentes | 1 | **VPC**, **EC2**, **RDS**, **S3** (+ IAM `LabInstanceProfile`) | VPC · EC2 · RDS · S3 |

**🖥️ Demostrar** (en `cc-backends`, después de 2.2):
```bash
cat ~/URLS.txt                                                     # URLs de los 4 servicios
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'  # BE1 :8081 y BE2 :5000 en EC2
curl -s -o /dev/null -w "BE1 parcelas: %{http_code}\n" $B1/api/parcelas
curl -s -o /dev/null -w "BE2 health:   %{http_code}\n" $B2/health
nc -zv $R 1433                                                     # BD 1: Amazon RDS
aws s3 ls | grep agropacayales-frontend                            # FE: Amazon S3
aws ec2 describe-instances --filters Name=instance-state-name,Values=running --query "Reservations[].Instances[].[Tags[?Key=='Name']|[0].Value,InstanceType,PrivateIpAddress]" --output table
```
**Qué decir:** "Uso 4 servicios: **VPC** para la red y los grupos de seguridad, **EC2** para MongoDB y los dos backends, **RDS** para SQL Server y **S3** para el frontend como sitio estático. Todo lo crea un único user data: cada EC2 lee su nombre y sabe qué instalar."

---

### ☸️ Orquestadores y Automatización de Software (3.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Clúster K8s sobre EC2 con **nodos dedicados** FE, BE1 y BE2 | 1 | **K3s**: `k8s-master` + 3 workers. Cada worker se etiqueta solo (`role=frontend/backend1/backend2`) y cada Deployment tiene **`nodeSelector`** a su nodo |
| Conectividad interna BE1 ↔ BE2 (negocio, autenticación, autorización, logs e ingesta) | 1 | El BE1 llama al BE2 por **DNS interno** (`http://backend-analitico:5000`). Cada alta/edición/baja exitosa genera un **evento** (`EventoNegocioWebFilter`) que se ingesta en `POST /api/v1/analytics/eventos` y se guarda en MongoDB (`business_events`). **Autenticación** JWT en el BE1 (`/api/auth/login`, `AuthWebFilter`) y **autorización** por roles en el frontend y la app |
| Rutas y reglas de red con **RDS 1433** y **MongoDB 27017** | 1 | **ConfigMap** con el endpoint de RDS y **Secret** con `MONGO_URI`. Grupos de seguridad: `evi-rds-sg` acepta 1433 solo desde las EC2; `evi-ec2-sg` permite 27017/6443/Flannel solo entre EC2 |
| Endpoints documentados (Postman / Swagger) | 0.5 | **NodePort** 30001 (Swagger BE1), 30002 (Swagger BE2), 30000 (frontend) |

**🖥️ Demostrar** (en `k8s-master`, después de 2.1):

**Criterio 1 — nodos dedicados**
```bash
kubectl get nodes -L role
kubectl get pods -n $NS -o wide          # cada pod en SU nodo
kubectl get deploy -n $NS -o custom-columns=APP:.metadata.name,NODO:.spec.template.spec.nodeSelector.role
```

**Criterio 2 — conectividad interna, autenticación e ingesta de logs**
```bash
# BE1 -> BE2 por DNS interno del clúster
kubectl -n $NS exec deploy/backend-transaccional -- wget -qO- http://backend-analitico:5000/health; echo
# Autenticación: login devuelve un JWT (usar un correo/clave de la tabla users)
curl -s -X POST $B1/api/auth/login -H 'Content-Type: application/json' -d '{"correo":"<correo>","password":"<clave>"}' | head -c 300; echo
# Ingesta de logs: crear algo en BE1 y ver el evento llegar al BE2
curl -s -X PATCH $B1/api/parcelas/PARC-NOR-001/eliminar >/dev/null; curl -s -X PATCH $B1/api/parcelas/PARC-NOR-001/restaurar >/dev/null
curl -s $B2/api/v1/analytics/eventos/ultimos | head -c 500; echo
```
> Para ver un usuario válido del login: en `mongosh` → `db.users.findOne({estado:true},{correo:1,password:1,rol:1})`

**Criterio 3 — RDS 1433 y MongoDB 27017**
```bash
kubectl get cm,secret -n $NS
kubectl -n $NS get cm agropacayales-config -o jsonpath='{.data.SQL_HOST}'; echo        # endpoint RDS
kubectl -n $NS get secret agropacayales-secret -o jsonpath='{.data.MONGO_URI}' | base64 -d; echo
curl -s $B2/status/database; echo                                                        # conexión SQL + Mongo
nc -zv $R 1433
```

**Criterio 4 — endpoints documentados**
```bash
kubectl get svc -n $NS                                                   # NodePort 30000/30001/30002
curl -s -o /dev/null -w "Swagger BE1: %{http_code}\n" -L $B1/swagger-ui.html
curl -s -o /dev/null -w "OpenAPI BE1: %{http_code}\n" $B1/api-docs
curl -s -o /dev/null -w "Swagger BE2: %{http_code}\n" $B2/apidocs/
```

**Extra — self-healing:** `kubectl delete pod -l app=frontend -n $NS && kubectl get pods -n $NS -w` (Ctrl+C para salir).

---

### 🏢 Talleres de Software Empresarial (3.5 pts) — mi maestro: **Parcelas**

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Mín. 12 campos con 4 de auditoría (fecha y hora) | 0.5 | **Parcela** tiene 20 campos + 6 **embebidos** (`condicionesEdaficas`, `sistemaRiego`). **4 de auditoría `LocalDateTime`:** `createdAt`, `updatedAt`, `deletedAt`, `restoredAt` |
| Registrar y editar (Swagger/Postman) | 1 | `POST /api/parcelas` → `createdAt` · `PUT /api/parcelas/{id}` → `updatedAt` |
| Eliminar y restaurar | 1 | `PATCH …/{id}/eliminar` → `estado=false` + `deletedAt` · `PATCH …/{id}/restaurar` → `estado=true` + `restoredAt` |
| Importar (mín. 10) y exportar (mín. 10) | 1 | `POST /api/parcelas/importar/csv` con [`csv/parcelas.csv`](csv/parcelas.csv) (**15 registros**) · `GET …/exportar/excel` y `/exportar/pdf` (todos los registros) |

**🖥️ Demostrar** (Swagger con los JSON de [`JSON_MAESTROS_SWAGGER.md`](JSON_MAESTROS_SWAGGER.md), o por terminal):
```bash
# Registrar
ID=$(curl -s -X POST $B1/api/parcelas -H 'Content-Type: application/json' -d '{"nombre":"Parcela Demo Ana","ubicacion":"Valle de Cañete - Sector B","areaHectareas":8.5,"tipoSuelo":"Franco","responsable":"Ana Félix","estadoRiego":"Completo","cultivoActual":"Palta","hectareas":8.5,"condicionesEdaficas":{"textura":"Franco arenoso","phPromedio":6.8,"materiaOrganicaPct":2.4},"sistemaRiego":{"tipo":"Goteo","caudalLph":4.5,"sectorValvula":"V-12"}}' | grep -o '"id":"[^"]*"' | cut -d'"' -f4); echo "ID=$ID"
# Editar
curl -s -X PUT $B1/api/parcelas/$ID -H 'Content-Type: application/json' -d '{"nombre":"Parcela Demo Ana","areaHectareas":8.5,"tipoSuelo":"Franco","estadoRiego":"En Proceso","cultivoActual":"Mandarina","hectareas":8.5}' | grep -o '"updatedAt":"[^"]*"'
# Eliminar y restaurar
curl -s -X PATCH $B1/api/parcelas/$ID/eliminar  | grep -oE '"estado":(true|false)|"deletedAt":"[^"]*"'
curl -s -X PATCH $B1/api/parcelas/$ID/restaurar | grep -oE '"estado":(true|false)|"restoredAt":"[^"]*"'
# Exportar (descarga Excel y PDF)
curl -s -o parcelas.xlsx -w "Excel: %{http_code} %{size_download} bytes\n" $B1/api/parcelas/exportar/excel
curl -s -o parcelas.pdf  -w "PDF:   %{http_code} %{size_download} bytes\n" $B1/api/parcelas/exportar/pdf
```
**Ver la auditoría en MongoDB** (en `mongosh`):
```js
db.plots.find({nombre:"Parcela Demo Ana"}, {nombre:1, estado:1, created_at:1, updated_at:1, deleted_at:1, restored_at:1})
```
**Qué decir:** "El eliminado es **lógico**: no se borra el documento, cambia `estado` y se guarda la fecha y hora en `deleted_at`. Al restaurar se registra `restored_at`. La API usa `camelCase` y MongoDB guarda en `snake_case` con `@Field`."

⚠️ **Reglas de la base (validador `$jsonSchema`)** para que no falle: `estadoRiego` solo `Completo`, `En Proceso`, `Pendiente` · `tipoSuelo` solo `Franco`, `Franco Arenoso`, `Arenoso`, `Franco Limoso`, `Arcilloso` · `areaHectareas` obligatorio (mín. 0.1). En la app móvil **no elegir** `Limoso` ni `Arcillo Limoso`.

---

### 📱 Desarrollo de Aplicaciones Móviles (3.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Estructura de carpetas | — | `src/app` (Expo Router), `src/services`, `src/modules`, `src/components`, `src/context`, `src/config`, `src/theme`, `src/utils` |
| Conexión a la BD por un **service** que consume la API | 1 | La app **nunca** toca la BD: `src/services/apiClient.ts` (fetch + JWT) y `crudService.ts` consumen el BE1 y el BE2. URLs en `.env` |
| Tabla maestra: modificar y eliminar | 0.5 | `maestro/[modulo]/formulario.tsx` edita · `maestro/[modulo]/[id].tsx` elimina y restaura |
| Lista de 10 registros + formulario | 1 | `maestro/[modulo]/index.tsx` lista los registros de la BD (160 parcelas) con búsqueda; botón **Registrar** abre el formulario |

**🖥️ Demostrar** (en tu PC, con el repo `ASE251S4_T05-mo` rama `develop`). Paso a paso completo (ZIP, limpieza, IP y puertos): [`MANUAL_APP_MOVIL_Y_GIT.md`](MANUAL_APP_MOVIL_Y_GIT.md)
```bash
git clone -b develop https://github.com/vallegrande/ASE251S4_T05-mo.git && cd ASE251S4_T05-mo
npm install --legacy-peer-deps
# .env Taller:      EXPO_PUBLIC_API_URL=http://<IP cc-backends>:8081/api   EXPO_PUBLIC_ANALYTICS_URL=http://<IP cc-backends>:5000/api/v1/analytics
# .env Kubernetes:  EXPO_PUBLIC_API_URL=http://<IP nodo>:30001/api         EXPO_PUBLIC_ANALYTICS_URL=http://<IP nodo>:30002/api/v1/analytics
npx expo start -c        # escanear el QR con Expo Go (o tecla w para web)
```
Mostrar en el código (VS Code): `src/services/apiClient.ts` → la línea `Authorization: Bearer` y que todas las llamadas usan `API_URL` (nunca una conexión directa a la BD).

---

### 🗄️ Gestión de Base de Datos (3.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Versionamiento de la persistencia políglota | 1 | **Liquibase** (repo `ASE251S4_T05-db`): un `changelog.xml` por motor y changesets **V001–V005 simétricos en SQL Server y MongoDB**. Cada uno con autor, comentario y **rollback**. **Míos: V002 y V005** |
| Implementar la persistencia políglota | 1 | **SQL Server (RDS):** `harvest`, `harvest_planting_cycle`, `actividad_cultivo`, `detalle_actividad`, `asignacion_cabecera`, `asignacion_detalle`, `cultivos`. **MongoDB:** `plots`, `supplies`, `users`, `field_records` y `business_events` |
| CRUD de maestros (Mongo) interactuando con transacciones (SQL) | 1.5 | Las transacciones guardan **claves lógicas** de los maestros: `cultivos.id_parcela = 'PARC-…'`, `detalle_actividad.id_insumo = 'INS-…'`, `asignacion_detalle.id_usuario = 'USR-…'`. **Mi ejemplo:** cosecha → cultivo (FK) → parcela de MongoDB → indicador A6 kg/ha |

#### ✅ Por qué está bien lo que hicimos (justificación)

| Decisión | Por qué es correcta |
| :-- | :-- |
| **Cosechas en SQL Server** | Es una transacción **cabecera-detalle**: necesita **PK, FK, UNIQUE y CHECK** para que nunca haya un detalle sin cosecha, un cultivo inexistente ni kilos negativos. Eso lo garantiza un motor relacional (ACID). |
| **Parcelas en MongoDB** | Es un catálogo con datos **anidados y variables** (condiciones del suelo y sistema de riego): se guardan **embebidos** en el mismo documento, sin JOIN, y se leen de una vez. |
| **Validación en las dos bases** | SQL Server con constraints; MongoDB con **`$jsonSchema`** (campos obligatorios, tipos, listas permitidas como `estado_riego` y patrón del `_id` `^PARC-…`). Así la base no acepta datos sucios aunque falle la aplicación. |
| **Claves lógicas entre motores** | No existe FK entre SQL Server y MongoDB, así que el vínculo se hace con **códigos de negocio legibles** (`PARC-NOR-001`) validados por el backend, y se cruzan en el analítico (A6). |
| **Borrado lógico + auditoría** | `estado` + `created_at/updated_at/deleted_at/restored_at` → nunca se pierde historia y se puede restaurar. |
| **Versionamiento con Liquibase** | Los cambios de esquema son **código** en Git: numerados (`VNNN`), con autor, **paridad** entre los dos motores, **rollback** declarado e historial auditado (`DATABASECHANGELOG`). Cualquiera reconstruye la BD igual en otra máquina. |
| **Script idempotente para AWS** | En el despliegue se usa `init_sqlserver_completo.sql`, que **recrea la BD limpia** (si existe la borra) y carga +800 registros: se puede ejecutar N veces con el mismo resultado, ideal para levantar todo en 1 hora. |

#### Mi transacción cabecera-detalle
```
harvest (cabecera)                         harvest_planting_cycle (detalle)
├─ id_harvest PK  ◄───────────────────────┤ id_harvest  FK (ON DELETE CASCADE)
├─ responsable  CHECK (no vacío)           ├─ id_harvest_detail PK
├─ fecha_cosecha                           ├─ id_cultivo  FK → cultivos ──► cultivos.id_parcela = 'PARC-…' ──► MongoDB plots
├─ estado (lógico)                         ├─ kilos_optimos CHECK (>= 0)
└─ created_at / updated_at                 ├─ kilos_merma   CHECK (>= 0)
                                           └─ UNIQUE (id_harvest, id_cultivo)
```

#### 🖥️ Demostrar en SQL Server (después de 2.1 o 2.2, función `S`)

**1. Tablas y registros**
```bash
S "SELECT t.name AS tabla, SUM(p.rows) AS registros FROM sys.tables t JOIN sys.partitions p ON t.object_id=p.object_id AND p.index_id IN (0,1) GROUP BY t.name ORDER BY t.name"
```
✅ `harvest` 60 · `harvest_planting_cycle` 120 · `cultivos` 50 · …

**2. Mi cabecera-detalle con el puente a MongoDB**
```bash
S "SELECT TOP 4 h.id_harvest, h.responsable, h.fecha_cosecha, c.nombre AS cultivo, c.id_parcela, d.kilos_optimos, d.kilos_merma FROM harvest h JOIN harvest_planting_cycle d ON d.id_harvest=h.id_harvest JOIN cultivos c ON c.id_cultivo=d.id_cultivo ORDER BY h.id_harvest"
```
✅ Cada detalle trae su cultivo y el **`id_parcela` (`PARC-NOR-001`…) que vive en MongoDB**.

**3. Integridad referencial (FK)**
```bash
S "SELECT fk.name AS fk, OBJECT_NAME(fk.parent_object_id) AS tabla, OBJECT_NAME(fk.referenced_object_id) AS referencia FROM sys.foreign_keys fk ORDER BY tabla"
S "SELECT OBJECT_NAME(parent_object_id) AS tabla, definition FROM sys.check_constraints WHERE OBJECT_NAME(parent_object_id) LIKE 'harvest%'"
```

**4. La base rechaza datos inválidos** (con `ROLLBACK`, no ensucia nada)
```bash
S "BEGIN TRAN; INSERT INTO harvest_planting_cycle (id_harvest,id_cultivo,kilos_optimos,kilos_merma) VALUES (1,9999,10,1); ROLLBACK;"
S "BEGIN TRAN; INSERT INTO harvest (responsable,fecha_cosecha) VALUES ('Ana Félix','2026-10-27'); INSERT INTO harvest_planting_cycle (id_harvest,id_cultivo,kilos_optimos,kilos_merma) VALUES (SCOPE_IDENTITY(),1,-5,1); ROLLBACK;"
```
✅ Probado: el primero → **`FK_harvest_detail_cultivo`** (cultivo inexistente); el segundo → **`CK_harvest_kilos_optimos`** (kilos negativos).

**5. Claves lógicas hacia MongoDB**
```bash
S "SELECT (SELECT COUNT(*) FROM cultivos WHERE id_parcela LIKE 'PARC-%') AS cultivos_con_parcela, (SELECT COUNT(*) FROM detalle_actividad WHERE id_insumo LIKE 'INS-%') AS detalles_con_insumo, (SELECT COUNT(*) FROM asignacion_detalle WHERE id_usuario LIKE 'USR-%') AS detalles_con_usuario"
S "SELECT TOP 3 c.id_parcela, SUM(d.kilos_optimos) AS kilos_optimos FROM harvest_planting_cycle d JOIN cultivos c ON c.id_cultivo=d.id_cultivo GROUP BY c.id_parcela ORDER BY kilos_optimos DESC"
```
✅ `50 · 200 · 160` y `PARC-LOM-019` con 17 550 kg óptimos.

#### 🖥️ Demostrar en MongoDB (`mongosh`, sección 2.3)
```js
db.getCollectionNames()                                         // plots, supplies, users, field_records, business_events
db.plots.countDocuments()                                       // 160
db.plots.findOne({_id:"PARC-LOM-019"}, {nombre:1, area_hectareas:1, cultivo_actual:1, condiciones_edaficas:1, sistema_riego:1})
db.getCollectionInfos({name:"plots"})[0].options.validator      // reglas $jsonSchema
db.plots.getIndexes()                                           // índice único por nombre
```
✅ **El puente completo:** `PARC-LOM-019` → 17 550 kg (SQL Server) ÷ **20.65 ha** (MongoDB) = **849.88 kg/ha**, el mismo valor que devuelve mi indicador:
```bash
curl -s $B2/api/v1/analytics/cosechas/rendimiento-parcela | grep -o '{[^{}]*PARC-LOM-019[^{}]*}'
```

#### 🖥️ Demostrar el versionamiento (Liquibase) — desde tu PC con Git Bash
```bash
git clone https://github.com/vallegrande/ASE251S4_T05-db.git && cd ASE251S4_T05-db
cat db/sqlserver/changelog.xml                       # orden V001..V005
cat db/sqlserver/changes/V002__create_insumos_kardex.sql   # mi changeset: autor, comentario y --rollback
cat db/mongodb/changes/V005__create_auditoria_labores.xml   # mi changeset equivalente en MongoDB
cat check/src/main/resources/release-manifest.json  # contrato: V001..V005 por motor y autor
git log --oneline -- db/                             # historial de cambios
./demo/lab.sh inspect                                # valida sin conexión: orden VNNN, rollback y paridad
```
`./demo/lab.sh inspect` imprime: *"Contrato esperado por motor: V005 · SQL Server: 5 cambios · MongoDB: 5 cambios · Secuencia, includes, identidades y rollback están alineados."*

Con Docker y `.env` configurado (opcional): `./demo/lab.sh status all` (pendientes), `./demo/lab.sh history all` (lo aplicado en `DATABASECHANGELOG`) y `./demo/demo-rollback.sh plan V004` (rollback controlado).

**Qué decir:** "Cada cambio de esquema es un changeset numerado y **simétrico** en los dos motores. Liquibase guarda en `DATABASECHANGELOG` qué se aplicó, quién y cuándo, y cada changeset tiene su **rollback**. Yo hice **V002** (kardex de insumos en SQL y catálogo de insumos con dosificación embebida en Mongo) y **V005** (auditoría inmutable de labores en ambos motores)."

> Si preguntan *"¿por qué en AWS no corriste Liquibase?"*: "Para levantar todo en una hora el despliegue usa el **script consolidado e idempotente**. El versionamiento formal se gestiona y valida con Liquibase en el repo de base de datos."

---

### 💡 Proyectos de Innovación Tecnológica (2.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Arquitectura del Backend Analítico | 0.5 | `app/config, database, models, repositories, routes, schemas, services, static` + `tests/`, `.env.example`, `.gitignore`, `README.md`, `requirements.txt` ✅ (repo `ASE251S4_T05_ba`) |
| Figma: dashboard por sección | 0.5 | **Mi sección Cosechas:** cards = A1 · circular = A2 · barras = A3 · tabla = A5 ⚠️ *link de Figma a mano* |
| Figma: dashboard general | 0.5 | `/api/v1/analytics/dashboard/general` ⚠️ *link de Figma a mano* |
| 6 indicadores por estudiante en Swagger/Postman | 1 | **A1–A6** en `/api/v1/analytics/cosechas/...`, en Swagger grupo **"Ana Félix - Cosechas"**, con caché de 60 s |

**🖥️ Demostrar** (en `k8s-master` o `cc-backends`):
```bash
for p in resumen calidad por-cultivo mensual por-responsable rendimiento-parcela seccion; do
  curl -s -o /dev/null -w "A $p -> %{http_code}\n" $B2/api/v1/analytics/cosechas/$p; done
curl -s $B2/api/v1/analytics/cosechas/resumen; echo
curl -s $B2/api/v1/analytics/presupuesto/stock-critico | head -c 400; echo
curl -s -o /dev/null -w "Swagger BE2: %{http_code}\n" $B2/apidocs/
```
✅ Probado: los 7 responden **200**; A1 = `total_cosechas 60 · eficiencia_cosecha_pct 97.51`.

**Estructura del analítico** (en el repo, rama `develop`): `ls app/` → `config database models repositories routes schemas services static utils`.

---

## 5. Cómo hice el levantamiento y por qué

### Idea central
**Un solo user data para todas las EC2.** Cada EC2 lee su etiqueta **Name** con la API de AWS y decide qué instalar → sin editar nada a mano, sin IPs escritas, sin errores en la evaluación.

### Kubernetes (orquestadores) — 5 EC2 + RDS
| Paso | Qué hice | Por qué |
| :-: | :-- | :-- |
| 1 | Grupos de seguridad `evi-ec2-sg` (30000-30002 públicos; todo el tráfico solo entre EC2) y `evi-rds-sg` (1433 solo desde las EC2) | Solo la app es pública; bases y clúster protegidos |
| 2 | **Primero la RDS** SQL Server (tarda 10–15 min) | Mientras se crea, lanzo las EC2 en paralelo → ≈ 25 min en total |
| 3 | 5 EC2 con el mismo user data: `k8s-master`, `ec2-mongodb`, `k8s-node-frontend`, `k8s-node-backend`, `k8s-node-backendAnalitico` | El nombre define el rol |
| 4 | `ec2-mongodb` instala MongoDB 8, crea usuario y clave, carga los datos y **recién después** abre el puerto | Los backends nunca ven una base vacía |
| 5 | Los workers buscan solos la IP del master, se unen con el token y **se etiquetan** (`role=…`) | Aislamiento con `nodeSelector` |
| 6 | El master descubre el endpoint de RDS y la IP de Mongo, **carga SQL Server** y aplica Namespace, ConfigMap, Secret, Deployments y Services NodePort | Persistencia políglota conectada automáticamente |
| 7 | Seguridad: credenciales en **Secret**, versiones fijas (imágenes `2.0`, scripts de un commit fijo) e **IMDSv2 hop limit 1** | Ningún contenedor puede leer las credenciales de AWS |

### Taller Cloud Computing — 2 EC2 + RDS + S3
Mismo enfoque con nombres propios (`cc-…`) para no chocar con Kubernetes en el mismo laboratorio. `cc-backends` levanta los 2 backends en Docker, carga SQL Server y **publica el frontend en S3** con la IP real de los backends; si el lab se reinicia y cambia la IP, se republica solo.

---

## 6. Preguntas probables (respuesta corta)

1. **¿Por qué MongoDB para parcelas y SQL Server para cosechas?** — Parcelas tiene datos flexibles y **embebidos** (suelo y riego) → documento. Cosechas necesita **integridad referencial** cabecera-detalle → relacional.
2. **¿Qué es el borrado lógico?** — Cambio `estado` a `false` y guardo `deleted_at`; se puede restaurar y no se pierde historial.
3. **¿Cuáles son los 4 campos de auditoría?** — `createdAt`, `updatedAt`, `deletedAt`, `restoredAt` (en Mongo `created_at`…), tipo fecha y hora.
4. **¿Cómo importas?** — `POST /api/parcelas/importar/csv` con el archivo en `file`; procesa fila por fila y responde importados, fallidos y el motivo. No permite duplicados ("Ya existe…").
5. **¿Por qué WebFlux?** — Reactivo y no bloqueante; por eso Mongo Reactive y **R2DBC** para SQL Server.
6. **Explica A6.** — Agrupa los **kilos óptimos** por parcela (SQL Server), trae las **hectáreas** de MongoDB y divide: kg/ha. Ej.: `PARC-LOM-019` = 849.88 kg/ha.
7. **¿Qué decisión apoya tu sección?** — Qué cultivo, parcela y responsable tienen **más merma o menor rendimiento**, para enfocar riego, capacitación y calidad exportable.
8. **¿Tu servicio de stock crítico?** — Pipeline de agregación de MongoDB: stock entre 1 y 15 → unidades para llegar a 30 → costo = unidades × precio → presupuesto total (S/ 34 002 con los datos de prueba) y decisión de compra.
9. **¿Qué hiciste en el versionamiento?** — **V002** (`insumos_kardex` en SQL e `insumos` con dosificación embebida en Mongo) y **V005** (`auditoria_labores` en ambos), con rollback.
10. **¿Cómo se comunica BE1 con BE2 en Kubernetes?** — Por el Service `backend-analitico` (DNS interno), sin IPs.
11. **¿Cómo saben los pods dónde está la RDS?** — El master la descubre con la API de AWS y la escribe en el **ConfigMap** (`SQL_HOST`); las credenciales van en el **Secret**.
12. **¿Qué pasa si se cae un pod?** — El Deployment lo recrea solo en su nodo (self-healing).
13. **¿Por qué NodePort?** — En el Learner Lab no hay balanceador administrado; NodePort expone cada servicio en un puerto fijo.
14. **¿La app móvil se conecta a la base?** — No: `services/apiClient.ts` consume la API REST con JWT.
15. **¿Cómo validan los datos en MongoDB?** — Doble capa: Bean Validation en el backend y **`$jsonSchema`** en la colección (obligatorios, tipos, listas permitidas, patrón del `_id`).

---

## 7. Lo que debo decir con honestidad si me lo preguntan

| Tema | Respuesta |
| :-- | :-- |
| `SECURITY_ENFORCE=false` | "Para probar Swagger y Postman sin token en la demo. Con `true`, toda ruta `/api/**` sin token responde 401." |
| Contraseñas | "Hoy se comparan en texto plano; la mejora es **BCrypt**." |
| Fechas de usuarios en el validador | "El `$jsonSchema` de `users` esperaba las fechas como texto y el backend las guarda como `LocalDate` (tipo date). Lo corregimos en el script de datos permitiendo `string` o `date`, sin perder las demás validaciones; en bases ya creadas se aplica con `collMod` (sección 2.4)." |
| Credenciales en `application.yml` | "Son valores por defecto de desarrollo; en AWS se reemplazan por variables de entorno (ConfigMap y Secret)." |
| Figma | Tener abiertos los links de tu sección y del dashboard general. |

---

## 8. Guion de demo (5 minutos)

1. **Consola AWS:** EC2, RDS (Available), grupos de seguridad (S3 si es el taller).
2. **Terminal `k8s-master`** (sección 2.1): `kubectl get nodes -L role` y `kubectl get pods -o wide`.
3. **Swagger BE1 – Parcela-Controller:** registrar → editar → eliminar → restaurar → importar `csv/parcelas.csv` → exportar Excel.
4. **Swagger BE1 – Harvest-Controller:** registrar una cosecha con 2 detalles.
5. **SQL Server:** consulta 2 (cabecera-detalle con `id_parcela`) y consulta 4 (la BD rechaza datos inválidos).
6. **MongoDB:** `db.plots.findOne({_id:"PARC-LOM-019"})` → hectáreas → mostrar A6 = 849.88 kg/ha.
7. **Swagger BE2 – Ana Félix - Cosechas:** A1, A2, A6 y stock crítico.
8. **Frontend y app móvil:** la parcela y la cosecha nuevas aparecen.
9. **Self-healing:** borrar el pod del frontend y verlo volver.
