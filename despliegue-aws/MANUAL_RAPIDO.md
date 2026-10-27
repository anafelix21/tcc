# Manual Rápido Clic por Clic — AgroPacayales en AWS (Desde Cero)

> **Unidad Didáctica:** Taller de Cloud Computing — Evaluación Intermedia (20/20)  
> **Proyecto:** AgroPacayales S.A.C. (Equipo T05)  
> Consola de AWS en **inglés**. Orden: **Grupos de seguridad → RDS → EC2 → IP Elástica → BDs → Demo en Vivo**.  
> Tener abierto [`user-data-universal.sh`](user-data-universal.sh) para copiar (Ctrl+A, Ctrl+C).

---

## 📋 0. Hoja de Datos: Lo que Tienes que Reemplazar al Crear desde Cero

Cada compañero tendrá su propia cuenta de AWS. Por tanto, ciertos endpoints e IDs cambian. **Anota estos datos a medida que los crees:**

### 0.1. Tabla de Datos Dinámicos a Reemplazar
| # | Variable | ¿En qué paso se genera? | Ejemplo Real | Tu Valor Real (Anota aquí) |
|---|---|---|---|---|
| **1** | **ID de Security Group (`sg-...`)** | Paso 2 (al crear `evi-ec2-sg`) | `sg-00ac74ff62ebece96` | `sg-_____________________` |
| **2** | **Endpoint de Amazon RDS** | Paso 4 (al crear RDS SQL Server) | `agropacayales-rds-sqlserver.c4rhnptakjkc.us-east-1.rds.amazonaws.com` | `________________________` |
| **3** | **Contraseña de RDS** | Paso 4 (Master password) | `AgroPacayales2026!` | `AgroPacayales2026!` (Recomendada) |
| **4** | **IP Pública de `ec2-mongodb`** | Paso 6 y 7 (en consola EC2) | `98.20.208.209` | `________________________` |
| **5** | **IP Elástica de `k8s-master`** | Paso 5.2 (al asignar Elastic IP) | `100.55.148.151` | `________________________` |

### 0.2. Valores Fijos que NO debes Modificar (Estándar del Equipo)
| Parámetro | Valor Fijo | Justificación |
|---|---|---|
| **SQL Server Usuario** | `admin` | Obligatorio en RDS (no usar `sa`) |
| **SQL Server Puerto y BD** | `1433` \| `agropacayales_db` | Contrato de conexión Backend 1 y Backend 2 |
| **MongoDB Usuario y Clave** | `admin` \| `Mongo12345` | Configurado en el script universal y backends |
| **MongoDB Puerto y BD** | `27017` \| `agropacayales_db` | Con `?authSource=admin` |
| **Namespace Kubernetes** | `agropacayales-namespace` | Aislamiento de pods |
| **NodePort Frontend** | `30000` | Nginx Web SPA |
| **NodePort Backend 1** | `30001` | Spring Boot WebFlux (`/swagger-ui.html`) |
| **NodePort Backend 2** | `30002` | Python Flask Analítica (`/apidocs/`, `/health`) |

---

## 1. Learner Lab ⏱ min 0

- [ ] **Start Lab** → esperar círculo verde → clic **AWS**
- [ ] Arriba a la derecha, verificar región: **United States (N. Virginia) `us-east-1`**

---

## 2. Grupo de seguridad `evi-ec2-sg` ⏱ min 1

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `evi-ec2-sg`
- [ ] Description: `evi-ec2-sg`
- [ ] VPC: dejar la que sale (default)

**Inbound rules:**
- [ ] **Add rule** → Type: **Custom TCP** → Port range: `30000-30002` (en un solo campo) → Source type: **Anywhere-IPv4** (`0.0.0.0/0`)
- [ ] **Add rule** → Type: **SSH** → Port: `22` → Source type: **Anywhere-IPv4** (`0.0.0.0/0`)
- [ ] **Add rule** → Type: **Custom TCP** → Port range: `27017` → Source type: **Anywhere-IPv4** (para conectar MongoDB Compass desde tu PC)
- [ ] Clic **Create security group**
- [ ] 👉 **COPIAR EL ID GENERADO** en la parte superior (ej: `sg-00ac74ff62ebece96`). Lo usarás en el siguiente subpaso y en el Paso 3.

**Regla interna (en el mismo grupo, recién creado):**
- [ ] Seleccionar `evi-ec2-sg` → pestaña **Inbound rules** → **Edit inbound rules** → **Add rule**
- [ ] Type: **All traffic** (bajar en la lista)
- [ ] Source type: **Custom**
- [ ] Source: pegar el ID `sg-...` copiado arriba → **elegir de la lista desplegable** (no basta con escribir el nombre)
- [ ] **Save rules**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| SSH | 22 | 0.0.0.0/0 |
| Custom TCP | 30000 - 30002 | 0.0.0.0/0 |
| Custom TCP | 27017 | 0.0.0.0/0 |
| All traffic | All | sg-... (`evi-ec2-sg`) |

---

## 3. Grupo de seguridad `evi-rds-sg` ⏱ min 3

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `evi-rds-sg`
- [ ] Description: `evi-rds-sg`
- [ ] VPC: default

**Inbound rules (aquí NO va All traffic):**
- [ ] **Add rule** → Type: **MSSQL** (puerto 1433) → Source type: **Custom** → Source: pegar el ID `sg-...` de `evi-ec2-sg` → **elegir de la lista desplegable**
- [ ] **Add rule** → Type: **MSSQL** (puerto 1433) → Source type: **Anywhere-IPv4** (`0.0.0.0/0`, para entrar con SSMS desde tu PC)
- [ ] Clic **Create security group**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| MSSQL | 1433 | sg-... (`evi-ec2-sg`) |
| MSSQL | 1433 | 0.0.0.0/0 |

---

## 4. RDS SQL Server ⏱ min 4 (tarda 10–15 min en crearse, no esperar)

**Buscador de arriba: RDS → Databases → Create database**

- [ ] **Standard create**
- [ ] Engine type: **Microsoft SQL Server**
- [ ] Database management type: **Amazon RDS**
- [ ] Edition: **SQL Server Express Edition**
- [ ] Templates: **Free tier** (si no sale, **Dev/Test**)

**Settings:**
- [ ] DB instance identifier: `agropacayales-rds-sqlserver`
- [ ] Master username: `admin`
- [ ] Credentials management: **Self managed** ⚠️ **NO** "Managed in AWS Secrets Manager" (si queda con Secrets Manager, AWS genera una clave desconocida y fallará con `Login failed for user 'admin'`)
- [ ] Master password: `AgroPacayales2026!`
- [ ] Confirm master password: `AgroPacayales2026!`

**Instance configuration:**
- [ ] DB instance class: **Burstable classes** → `db.t3.micro` (si no sale, `db.t3.small`)

**Storage:**
- [ ] Storage type: **gp3** · Allocated storage: `20`
- [ ] Abrir **Additional storage configuration** → ☐ desmarcar **Enable storage autoscaling**

**Connectivity:**
- [ ] Compute resource: **Don't connect to an EC2 compute resource**
- [ ] VPC: default
- [ ] Public access: **Yes** (para conectarte desde SSMS / Azure Data Studio)
- [ ] VPC security group: **Choose existing** → agregar `evi-rds-sg` → quitar `default` (X)

**Monitoring (CRÍTICO para evitar error de permisos IAM en Voclabs):**
- [ ] ☐ desmarcar **Performance Insights** / **Database Insights**
- [ ] ☐ desmarcar **Enhanced Monitoring** (Monitoreo mejorado)

**Additional configuration (abajo, abrirlo):**
- [ ] ☐ desmarcar **Enable automated backups** (retención 0 días)

- [ ] Clic **Create database** (si sale ventana de add-ons → **Close**)
- [ ] Estado: **Creating** → seguir al paso 5 inmediatamente sin esperar.

---

## 5. EC2 `k8s-master` e IP Elástica ⏱ min 7

### 5.1. Lanzar la Instancia `k8s-master`
**EC2 → Instances → Launch instances**

**Name and tags:**
- [ ] Name: `k8s-master`

**Application and OS Images:**
- [ ] **Ubuntu** → **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** · **64-bit (x86)**

**Instance type:**
- [ ] `t3.small`

**Key pair (login):**
- [ ] `vockey`

**Network settings → Edit:**
- [ ] VPC: default
- [ ] Auto-assign public IP: **Enable**
- [ ] Firewall: **Select existing security group** → `evi-ec2-sg`

**Configure storage:**
- [ ] `20` GiB · gp3

**Advanced details (abrirlo, abajo):**
- [ ] IAM instance profile: **`LabInstanceProfile`** ⚠️ (Obligatorio)
- [ ] User data (al final): pegar **todo** el contenido de [`user-data-universal.sh`](user-data-universal.sh)

- [ ] Clic **Launch instance** → **View all instances**

---

### 5.2. Asignar la IP Elástica (Para que NUNCA cambie al reiniciar AWS)
> 💡 *En AWS Academy, al apagar y prender la máquina la IP cambia. La IP elástica la fija permanentemente.*

1. En la consola EC2, menú izquierdo: **Elastic IPs** → Clic en **Allocate Elastic IP address** → **Allocate**.
2. Seleccionar la IP recién creada → **Actions** → **Associate Elastic IP address**.
3. En **Instance**: seleccionar tu **`k8s-master`**.
4. Clic en **Associate**.
5. 👉 **Anota esa IP Elástica** (ej: `100.55.148.151`). Esta será la IP oficial de Swagger y del Frontend.

---

## 6. Las otras 4 EC2 ⏱ min 9–12

Repetir 4 veces usando la función clonar de AWS:

- [ ] Marcar ☑ `k8s-master` → **Actions → Image and templates → Launch more like this**
- [ ] Name and tags → cambiar **Name**
- [ ] Instance type → cambiar tipo
- [ ] Configure storage → cambiar disco
- [ ] Advanced details → confirmar que tenga **`LabInstanceProfile`** y el **User data** pegado
- [ ] **Launch instance**

| ✔ | Name (exacto, sin espacios) | Instance type | Storage | Qué contiene |
| :-: | :-- | :-- | :-- | :-- |
| ☐ | `ec2-mongodb` | `t3.small` | 8 GiB | MongoDB 8.0 nativo (NoSQL) |
| ☐ | `k8s-node-frontend` | `t3.small` | 20 GiB | Node K3s para Frontend Web |
| ☐ | `k8s-node-backend` | **`t3.medium`** | 20 GiB | Node K3s para Backend 1 (Spring Boot) |
| ☐ | `k8s-node-backendAnalitico` | `t3.small` | 20 GiB | Node K3s para Backend 2 (Flask) |

---

## 7. Revisar ⏱ min 13

**EC2 → Instances**
- [ ] Deben aparecer 5 instancias en estado **Running** con sus nombres exactos.
- [ ] Si a alguna le falta el rol: marcarla → **Actions → Security → Modify IAM role** → `LabInstanceProfile` → **Update IAM role** (continúa sola sin reiniciar).

---

## 8. Esperar el Avance Automático ⏱ min 13 → 22

- [ ] Marcar ☑ `k8s-master` → **Actions → Monitor and troubleshoot → Get system log**
- [ ] Buscar líneas con `[AGRO]`. Cerrar y volver a abrir cada 1–2 min.
- [ ] Orden de finalización:
  1. `K3s server instalado`
  2. `Esperando que RDS SQL Server termine de crearse...` (normal, tarda ≈10 min)
  3. `MongoDB: ... | RDS: ...` (las descubrió solas)
  4. `SQL SERVER POBLADO` (tablas y +800 registros cargados en RDS)
  5. `Manifiestos aplicados...`
  6. `DESPLIEGUE TERMINADO` + URLs
  7. `DESPLIEGUE COMPLETO` ✅

---

## 9. Abrir la Aplicación ⏱ min 22

En **EC2 → Instances**, copia la **Public IPv4 address** de cada máquina (o usa la IP elástica para el master).  
*(Usar `http://`, no `https://`)*:

| ✔ | Componente | URL de Acceso |
| :-: | :-- | :-- |
| ☐ | **Frontend Web** | `http://<IP de k8s-node-frontend>:30000` |
| ☐ | **Backend 1 — Swagger UI** | `http://<IP_ELASTICA_O_IP_NODE_BACKEND>:30001/webjars/swagger-ui/index.html` |
| ☐ | **Backend 1 — OpenAPI JSON** | `http://<IP>:30001/api-docs` (importar en Postman) |
| ☐ | **Backend 2 — Swagger Docs** | `http://<IP de k8s-node-backendAnalitico>:30002/apidocs/` |
| ☐ | **Backend 2 — Health Check** | `http://<IP de k8s-node-backendAnalitico>:30002/health` |

---

## 10. Conectarse y Ejecutar Scripts en las Bases de Datos desde tu PC ⏱ min 23

### 10.1. SQL Server Management Studio (SSMS) o Azure Data Studio
1. **RDS → Databases →** `agropacayales-rds-sqlserver` → pestaña **Connectivity & security** → copiar **Endpoint**.
2. Abrir SSMS y conectar:
   * **Server name:** `<TU_ENDPOINT_DE_RDS>,1433` *(con coma)*
   * **Authentication:** SQL Server Authentication
   * **Login:** `admin` · **Password:** `AgroPacayales2026!`
   * **Encryption:** Mandatory · ☑️ **Trust server certificate**
3. Clic en **Connect**.
4. Abrir el archivo [`scripts/init_sqlserver_completo.sql`](../scripts/init_sqlserver_completo.sql) y clic en **Execute / Run** *(si el script universal ya terminó, las tablas ya están creadas; puedes verificar haciendo clic derecho en `agropacayales_db` → Tables → Select Top 1000 Rows)*.

### 10.2. MongoDB Compass
1. **EC2 → Instances** → marcar ☑ `ec2-mongodb` → copiar **Public IPv4 address**.
2. En Compass → **Add new connection** → pegar URI:
   ```text
   mongodb://admin:Mongo12345@<TU_IP_PUBLICA_EC2_MONGO>:27017/agropacayales_db?authSource=admin
   ```
   *(Reemplaza `<TU_IP_PUBLICA_EC2_MONGO>` por la IP pública de tu `ec2-mongodb`)*.
3. Clic en **Save & Connect**.
4. Verás la base `agropacayales_db` con las colecciones `supplies`, `users`, `plots`, `field_records`.
5. *(Opcional)* Si necesitas recargar los datos manualmente desde la terminal de `ec2-mongodb`:
   ```bash
   curl -sSL https://raw.githubusercontent.com/anafelix21/tcc/main/scripts/init_mongodb_completo.js | mongosh "mongodb://admin:Mongo12345@localhost:27017/?authSource=admin"
   ```

---

## 11. Guion de Demostración en Vivo ante el Docente ⏱ min 24

1. En la consola EC2, marca ☑ `k8s-master` → **Connect** → pestaña **EC2 Instance Connect** → **Connect**.
2. Ejecuta estos comandos uno por uno para sustentar cada criterio de la rúbrica:

```bash
# 1. URLs de acceso y estado general
cat ~/URLS.txt
```
*(Muestra las URLs públicas y puertos).*

```bash
# 2. Criterio 1: Clúster de Kubernetes y roles dedicados
kubectl get nodes -L role
```
*(Evidencia 4 nodos K3s, cada uno con su etiqueta `role=frontend`, `role=backend1`, `role=backend2`).*

```bash
# 3. Criterio 1: Distribución de Pods en nodos dedicados
kubectl get pods -n agropacayales-namespace -o wide
```
*(Muestra que cada pod corre en su propio nodo sin colisión).*

```bash
# 4. Criterio 2: Comunicación interna inter-servicios (Backend 1 -> Backend 2)
kubectl -n agropacayales-namespace exec deploy/backend-transaccional -- wget -qO- http://backend-analitico:5000/health
```
*(Demuestra que Backend 1 llama internamente a Backend 2 por DNS del clúster recibiendo HTTP 200 y `status: UP`).*

```bash
# 5. Criterio 3: Conexión interna políglota a las 2 BDs (RDS SQL Server + Mongo EC2)
kubectl -n agropacayales-namespace exec deploy/backend-analitico -- curl -s localhost:5000/status/database
```
*(Reporta estado CONNECTED hacia RDS puerto 1433 y MongoDB puerto 27017).*

```bash
# 6. Criterio 4: Resiliencia y Self-Healing de Kubernetes en vivo
kubectl delete pod -l app=frontend -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace -w
```
*(Se observa cómo Kubernetes recrea el pod en 2 segundos. Presiona `Ctrl + C` para salir).*

```bash
# 7. Criterio 4 (Bonus): Escalabilidad horizontal dinámica
kubectl scale deployment backend-transaccional --replicas=3 -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace
```
*(Demuestra 3 réplicas del backend transaccional en caliente).*

---

## 📋 12. Catálogo de Payloads JSON para CRUD de Maestros (Swagger UI)

Abre Swagger UI en tu navegador: **`http://<IP_BACKEND1>:30001/webjars/swagger-ui/index.html`**

### 12.1. Insumos Agrícolas (MongoDB: `supplies`)
* **Endpoint:** `POST /api/insumos` (Try it out → Pegar y Execute):
```json
{
  "id": "INS-FERT-999",
  "nombre": "Nitrato de Calcio Grado Fertirriego Ultra",
  "descripcion": "Fertilizante hidrosoluble de alta asimilación para etapa fenológica de cuajado",
  "precio": 89.50,
  "stock": 150.0,
  "unidadMedida": "KG",
  "tipoInsumo": "Fertilizante",
  "categoria": "Fertirriego",
  "proveedor": "Yara Perú S.A.C.",
  "estado": true
}
```
* **Consultar:** `GET /api/insumos` (Verificar que aparece en la lista).

---

### 12.2. Parcelas de Cultivo (MongoDB: `plots`)
* **Endpoint:** `POST /api/parcelas`:
```json
{
  "id": "PARC-SUR-888",
  "nombre": "Sector Sur - Parcela Experimental 888",
  "ubicacion": "Fundo AgroPacayales, Lote 14 Valle de Cañete",
  "areaHectareas": 5.20,
  "hectareas": 5.20,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Ana Félix",
  "estadoRiego": "Activo",
  "cultivoActual": "Palto Hass",
  "produccionEstimada": "32 Toneladas",
  "fechaUltimaSiembra": "2026-04-10",
  "observaciones": "Monitoreo fenológico semanal mediante inspección agronómica.",
  "enUso": true,
  "estado": true
}
```

---

### 12.3. Fichas de Campo y Cuaderno Técnico (MongoDB: `field_records`)
* **Endpoint:** `POST /api/fichas-campo`:
```json
{
  "id": "FICHA-2026-001",
  "parcelaId": "PARC-SUR-888",
  "cultivo": "Palto Hass",
  "etapaFenologica": "Floración",
  "porcentajeDesarrollo": 65,
  "temperaturaCampo": "24.5°C",
  "clima": "Soleado",
  "humedadSuelo": "Óptima (Riego presurizado activo)",
  "vigor": "Excelente",
  "sanidad": "Sin plagas activas",
  "diagnosticoTecnico": "Excelente brotación floral. Mantener régimen hídrico.",
  "evaluador": "Hugo Fernández",
  "fechaInspeccion": "2026-10-26"
}
```

---

### 12.4. Cultivos en SQL Server (Amazon RDS)
* **Endpoint:** `POST /api/cultivos`:
```json
{
  "nombre": "Arándano Biloxi Exportación",
  "variedad": "Biloxi",
  "tipo": "Frutal",
  "cicloDias": 180,
  "temporada": "Invierno-Primavera",
  "temperaturaOptimaMin": 14.5,
  "temperaturaOptimaMax": 26.0,
  "humedadOptimaMin": 60.0,
  "humedadOptimaMax": 80.0,
  "rendimientoEstimadoPorHa": 18.5,
  "estado": "ACTIVO"
}
```

---

## 13. Al Terminar la Presentación (Cierre de Seguridad)

- [ ] **EC2 → Security Groups** → `evi-ec2-sg` → **Edit inbound rules** → **Delete** en SSH 22 y en 27017 → **Save rules**
- [ ] `evi-rds-sg` → **Edit inbound rules** → **Delete** en la regla MSSQL **0.0.0.0/0** → **Save rules**
- [ ] **RDS → Modify** → Public access: **Not publicly accessible** → **Apply immediately**

---

## 🔍 Comando Único: Revisar que Todo Esté Conectado

- [ ] Marcar ☑ `k8s-master` → **Connect** → **EC2 Instance Connect** → **Connect**
- [ ] Copiar y pegar **todo** este comando en una sola línea:

```bash
R=$(aws rds describe-db-instances --query "DBInstances[?starts_with(Engine,'sqlserver')]|[0].Endpoint.Address" --output text); echo "== RDS: $R"; nc -zv -w5 "$R" 1433 && sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -Q "SET NOCOUNT ON; SELECT COUNT(*) AS tablas FROM sys.tables; SELECT DISTINCT client_net_address AS ips_conectadas FROM sys.dm_exec_connections"; echo "== PODS"; kubectl get pods -n agropacayales-namespace -o wide; echo "== AVANCE"; sudo grep AGRO /var/log/agropacayales.log | tail -3
```

**Cómo interpretar la salida:**

| Salida | Significado |
| :-- | :-- |
| `== RDS: None` | La RDS aún se está creando: esperar 2 min y volver a pegar |
| `succeeded!` | El master llega a la RDS por el puerto 1433 ✅ |
| `tablas` con número (>0) | Login correcto y datos SQL Server cargados ✅ |
| `ips_conectadas` con `172.31.x.x` | Los backends del clúster están conectados a la RDS ✅ |
| `Login failed` | La RDS quedó con Secrets Manager: **Modify → Self managed** |
| Pods `1/1 Running` | Aplicación y microservicios levantados con éxito ✅ |
| Última línea `DESPLIEGUE COMPLETO` | Todo el despliegue finalizó al 100% ✅ |

---

## 🛠️ Solucionario si Algo se Traba

| Mensaje en el System Log | Solución |
| :-- | :-- |
| `SIN PERMISOS AWS` | En EC2: seleccionar la máquina → **Actions → Security → Modify IAM role** → `LabInstanceProfile`. |
| `no corresponde a ningún rol` | El nombre de la EC2 tiene un typo: **Instance state → Terminate** y relanzar con el nombre exacto (`k8s-master`, `ec2-mongodb`, `k8s-node-frontend`, `k8s-node-backend`, `k8s-node-backendAnalitico`). |
| `Esperando ...:1433` | La RDS no tiene asignado `evi-rds-sg`: RDS → la BD → **Modify** → Security group `evi-rds-sg` → **Apply immediately**. |
| `Esperando ...:27017` o `:6443` | Falta la regla interna del Paso 2: **All traffic** con origen `sg-...` de `evi-ec2-sg`. |
| `Login failed for user 'admin'` | En RDS (Connectivity & security) figura Secrets Manager: **Modify** → desmarcar Secrets Manager (Self managed). Colocar clave `AgroPacayales2026!` → **Apply immediately**. |
| Error rojo "CIDR block, a security group ID..." | En Source escribiste el nombre: borra la etiqueta y **elige el `sg-...` de la lista**. |
| SSMS: *timeout* / *network-related error* | RDS no está **Available**, Public access no es **Yes**, o falta MSSQL **Anywhere-IPv4** en `evi-rds-sg`. |
| SSMS: *certificate chain not trusted* | Marcar casilla ☑️ **Trust server certificate**. |
| Compass: *connection timed out* | Falta 27017 **Anywhere-IPv4** en `evi-ec2-sg`, o la IP de `ec2-mongodb` está mal copiada. |
| Compass: *Authentication failed* | La URI debe terminar en `?authSource=admin`. |
