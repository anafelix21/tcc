# 🚀 MANUAL DEFINITIVO DE DESPLIEGUE: 4 SERVICIOS AWS (DESDE CERO)
## Unidad Didáctica: Taller de Cloud Computing — Evaluación Intermedia (20/20)
### Proyecto: AgroPacayales S.A.C. (Equipo T05)
*Guía paso a paso para desplegar en una cuenta de AWS nueva desde cero. Incluye qué valores debes anotar y reemplazar.*

---

## 📋 1. Hoja de Datos de tu Despliegue (Anota tus valores aquí)

A medida que vayas creando los recursos en tu cuenta de AWS, **anota estos 6 datos**. Los usarás para conectarte y para configurar los archivos sin equivocarte:

| # | Dato a Anotar | ¿En qué paso se genera? | Ejemplo de Valor | Tu Valor Real (Rellena aquí) |
|---|---|---|---|---|
| **1** | **Endpoint de Amazon RDS** | Paso 2 (al crear RDS SQL Server) | `agropacayales-rds.c4rhnptakjkc.us-east-1.rds.amazonaws.com` | `________________________________` |
| **2** | **Contraseña de RDS** | Paso 2 (la que definas al crear RDS) | `SQLServer12345` | `________________________________` |
| **3** | **IP Privada de `ec2-mongodb`** | Paso 3 (en la consola EC2) | `10.0.5.187` | `________________________________` |
| **4** | **IP Pública de `ec2-mongodb`** | Paso 3 (para MongoDB Compass) | `98.20.208.209` | `________________________________` |
| **5** | **IP Elástica de `k8s-master`** | Paso 4 (al asignar Elastic IP) | `100.55.148.151` | `________________________________` |
| **6** | **Nombre de tu Bucket S3** | Paso 5 (debe ser único en el mundo) | `agropacayales-frontend-juan` | `________________________________` |

---

## 🎯 2. Matriz de Cumplimiento de Rúbrica Oficial (20/20)

| Criterio de la Rúbrica | Componente Aprovisionado | Servicio AWS Empleado | Categoría Oficial AWS | Justificación para la Evaluación |
| :--- | :--- | :--- | :--- | :--- |
| **Criterio 1: 2 Bases de Datos empleando 2 servicios diferentes de AWS** | **BD 1 (Relacional):** SQL Server Express 2022 (`agropacayales_db`)<br><br>**BD 2 (NoSQL):** MongoDB 8.0 nativo (`agropacayales_db`) | **Amazon RDS**<br><br>**Amazon EC2** (`ec2-mongodb`) | *Database* (PaaS Relacional)<br><br>*Compute* (IaaS con Motor NoSQL dedicado) | BD relacional administrada para transacciones ACID (puerto 1433) y servidor NoSQL dedicado para insumos, parcelas y bitácora fenológica (puerto 27017). |
| **Criterio 2: 2 Backends empleando mínimo 1 servicio de AWS** | **Backend 1:** Spring Boot Java 17 (`:8081`)<br>**Backend 2:** Python Flask / Pandas (`:5000`) | **Amazon EC2** (Clúster K3s) | *Compute* (IaaS / Orquestación) | Microservicios orquestados en contenedores con alta disponibilidad en los nodos K3s (NodePorts `30001` y `30002`). |
| **Criterio 3: Frontend Web empleando 1 servicio diferente a los anteriores** | **Frontend Web:** React 19 + TypeScript + Vite SPA | **Amazon S3** (Static Website) | *Storage* (Almacenamiento de Objetos) | Hosting desacoplado, estático y serverless en S3, completamente diferente a cómputo y bases de datos. |
| **Criterio 4: Mínimo 4 servicios diferentes de AWS en total** | **Infraestructura de Red y Conectividad** | **Amazon VPC** | *Networking & Content Delivery* | Red privada virtual (`10.0.0.0/16`) creada desde cero con subredes públicas, Internet Gateway y Security Groups para interconectar todo. |

---

## 🌐 PASO 1: Servicio AWS #1 — Amazon VPC (Creación en 2 min)

Este paso no requiere reemplazar nada; los nombres son estándar para todo el equipo:

### 1.1. Crear la VPC con el Asistente "VPC y más"
1. En la consola de AWS, busca **VPC** → Clic en **Crear VPC** (*Create VPC*).
2. Selecciona la opción: 👉 **"VPC y más"** (*VPC and more*).
3. Configuración:
   * **Nombre:** `agropacayales-vpc`
   * **Bloque CIDR IPv4:** `10.0.0.0/16`
   * **Zonas de disponibilidad (AZ):** `2` *(RDS exige mínimo 2 zonas)*.
   * **Subredes públicas:** `2`
   * **Subredes privadas:** `0` *(Cero, para no pagar NAT Gateway)*.
   * **Pasarelas NAT:** `Ninguna` (*None*).
   * **Extremos de VPC:** `Ninguno` (*None*).
4. Clic en **Crear VPC**.

### 1.2. Habilitar DNS y Asignación de IP Pública
1. **Activar DNS:** Ve a **Tus VPC** → selecciona `agropacayales-vpc` → **Acciones** → **Editar la configuración de la VPC** → Marca:
   * ☑️ **Habilitar la resolución de DNS** (*DNS resolution*).
   * ☑️ **Habilitar nombres de host de DNS** (*DNS hostnames*).
   * Clic en **Guardar**.
2. **IPs públicas en Subredes:** Ve a **Subredes** → selecciona `agropacayales-subnet-public1` → **Acciones** → **Editar configuración de la subred** → Marca:
   * ☑️ **Habilitar la asignación automática de direcciones IPv4 públicas**.
   * Guarda y repite el mismo paso con `agropacayales-subnet-public2`.

### 1.3. Crear el Security Group Unificado (`agropacayales-sg`)
1. Ve a **Grupos de seguridad** (*Security Groups*) → **Crear grupo de seguridad**.
2. **Nombre:** `agropacayales-sg` | **VPC:** `agropacayales-vpc`.
3. **Reglas de entrada (Inbound rules):**
   * **SSH:** TCP `22`, Origen `0.0.0.0/0`.
   * **NodePorts K3s:** TCP `30000-30002`, Origen `0.0.0.0/0`.
   * **SQL Server:** TCP `1433`, Origen `0.0.0.0/0`.
   * **MongoDB:** TCP `27017`, Origen `0.0.0.0/0`.
   * **Todo el tráfico (All traffic):** Origen `agropacayales-sg` *(red interna entre pods y K3s)*.
4. Clic en **Crear grupo de seguridad**.

---

## 🗄️ PASO 2: Servicio AWS #2 — Amazon RDS SQL Server (PaaS Relacional)

### 2.1. Crear la Base de Datos en Amazon RDS
1. Consola AWS → **RDS** → **Create database** (Creación estándar).
2. **Motor:** `Microsoft SQL Server` → **Edición:** `SQL Server Express Edition`.
3. **Identificador:** `agropacayales-rds`.
4. **Master username:** `admin`.
5. **Master password:** `SQLServer12345` *(o la que elijas, anótala en el Dato #2)*.
6. **Clase de instancia:** 👉 **`db.t3.micro`** (1 vCPU, 1 GB RAM). *(¡No uses otra para evitar el bloqueo de Voclabs!)*.
7. **Almacenamiento:** `20 GiB` | ❌ **DESMARCA:** "Habilitar el escalado automático del almacenamiento".
8. **Conectividad:**
   * **VPC:** `agropacayales-vpc`.
   * **Acceso público:** `Yes` *(para conectarte desde Azure Data Studio/SSMS en tu PC)*.
   * **Security Group:** Selecciona **`agropacayales-sg`** (y retira el default).
9. **Monitoreo (CRÍTICO para evitar error de permisos IAM `iam:CreateRole`):**
   * ❌ **DESMARCA:** "Habilitar el monitoreo mejorado" (*Enhanced Monitoring*).
10. **Configuración adicional:**
    * ❌ **DESMARCA:** "Habilitar Performance Insights".
    * Copias de seguridad: Retención en `0` días.
11. Clic en **Create database**.
12. 👉 **ANOTA EL DATO #1:** Cuando esté en estado **Available**, copia el **Endpoint** (ej: `agropacayales-rds.c4rhnptakjkc.us-east-1.rds.amazonaws.com`).

### 2.2. Conectarse y ejecutar el Script SQL
1. Abre en tu PC **Azure Data Studio** o **SQL Server Management Studio (SSMS)**.
2. Parámetros de conexión:
   * **Servidor / Server:** `<TU_ENDPOINT_DE_RDS>,1433`  *(reemplaza por tu Dato #1)*
   * **Autenticación:** SQL Server Authentication
   * **Usuario:** `admin`
   * **Contraseña:** `SQLServer12345` *(reemplaza por tu Dato #2)*
3. Abre el archivo del proyecto [`scripts/init_sqlserver_completo.sql`](file:///e:/Nueva%20carpeta%20%288%29/tcc/scripts/init_sqlserver_completo.sql).
4. Haz clic en **Run / Ejecutar**.  
   *(El script crea automáticamente la base de datos `agropacayales_db` y las 7 tablas con más de 800 registros de prueba)*.

---

## 🍃 PASO 3: Servicio AWS #3 — Amazon EC2 MongoDB (NoSQL Dedicado)

### 3.1. Lanzar la Instancia `ec2-mongodb`
1. Consola AWS → **EC2** → **Launch Instance**:
   * **Nombre:** `ec2-mongodb` | **AMI:** Ubuntu 24.04 LTS | **Tipo:** `t3.small` o `t3.micro`.
   * **Key pair:** Selecciona tu archivo `.pem`.
   * **Network Settings** (Editar):
     * **VPC:** `agropacayales-vpc`.
     * **Subred:** Cualquiera de las 2 públicas.
     * **Auto-assign public IP:** Habilitado.
     * **Security Group:** `agropacayales-sg`.
2. Lanza la instancia.
3. 👉 **ANOTA EL DATO #3:** Copia su **IP privada** (ej: `10.0.5.187`).
4. 👉 **ANOTA EL DATO #4:** Copia su **IP pública** (ej: `98.20.208.209`).

### 3.2. Instalación en 1 Línea con Parche de Kernel
Conéctate por SSH a `ec2-mongodb` desde tu PC:
```bash
ssh -i "tu-llave.pem" ubuntu@<TU_IP_PUBLICA_EC2_MONGO>
```
*(Reemplaza `<TU_IP_PUBLICA_EC2_MONGO>` por tu Dato #4)*.

Copia y pega este bloque completo:
```bash
# 1. Instalar paquetes de MongoDB 8.0 en Ubuntu 24.04
sudo apt update && sudo apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt update && sudo apt install -y mongodb-org

# 2. Aplicar parche de kernel rseq=1 y habilitar acceso público 0.0.0.0
sudo mkdir -p /etc/systemd/system/mongod.service.d
printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' | sudo tee /etc/systemd/system/mongod.service.d/rseq.conf
sudo sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf

# 3. Iniciar el servicio y crear usuario admin
sudo systemctl daemon-reload && sudo systemctl enable --now mongod
sleep 3
mongosh --eval 'db.getSiblingDB("admin").createUser({user:"admin",pwd:"Mongo12345",roles:["root"]})'
```

### 3.3. Ejecutar el Script de Inicialización de MongoDB en 1 segundo
Ahí mismo en la terminal de `ec2-mongodb`, ejecuta:
```bash
curl -sSL https://raw.githubusercontent.com/anafelix21/tcc/main/scripts/init_mongodb_completo.js | mongosh "mongodb://admin:Mongo12345@localhost:27017/?authSource=admin"
```
*(Crea las colecciones `supplies`, `plots`, `users` y `field_records` con esquemas validados y datos)*.

### 3.4. Conexión desde MongoDB Compass (en tu PC)
1. Abre **MongoDB Compass**.
2. En la barra de conexión pega:
   ```text
   mongodb://admin:Mongo12345@<TU_IP_PUBLICA_EC2_MONGO>:27017/?authSource=admin
   ```
   *(Reemplaza `<TU_IP_PUBLICA_EC2_MONGO>` por tu Dato #4)*.
3. Clic en **Connect**. Verás la base de datos `agropacayales_db`.
> 💡 *Si sale un aviso rojo en Compass (`useConnectionInfo hook`), es un bug visual de Compass: solo cierra la pestaña con la `x` o presiona `Ctrl + R`*.

---

## ⚙️ PASO 4: Clúster K3s, IP Elástica y Despliegue de Microservicios

### 4.1. Lanzar la Instancia `k8s-master`
1. Consola AWS → **EC2** → **Launch Instance**:
   * **Nombre:** `k8s-master` | **AMI:** Ubuntu 24.04 LTS | **Tipo:** `t3.medium` o `t3.small`.
   * **Network Settings:** VPC `agropacayales-vpc`, Subred pública, Security Group `agropacayales-sg`.
2. Lanza la instancia.

### 4.2. Asignar la IP Elástica (Para que NUNCA cambie al apagar AWS)
1. En **EC2** → menú izquierdo: **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
2. Selecciona la IP → **Actions** → **Associate Elastic IP address**.
3. En **Instance**: Elige tu **`k8s-master`** → Clic en **Associate**.
4. 👉 **ANOTA EL DATO #5:** Copia esa **IP Elástica** (ej: `100.55.148.151`).

### 4.3. Instalar K3s en `k8s-master`
Conéctate por SSH a tu master desde tu PC:
```bash
ssh -i "tu-llave.pem" ubuntu@<TU_IP_ELASTICA_MASTER>
```
*(Reemplaza `<TU_IP_ELASTICA_MASTER>` por tu Dato #5)*.

Copia y pega para instalar K3s y `kubectl`:
```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--token agropacayales-token-2026 --write-kubeconfig-mode 644" sh -
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown -R ubuntu:ubuntu ~/.kube
sudo ln -sf /usr/local/bin/k3s /usr/bin/kubectl
```

---

### 4.4. Generación Automática del Manifiesto `agropacayales.yml`

Para evitar errores escribiendo a mano, **solo cambia las 3 variables de arriba con tus datos anotados** y pega todo el bloque en la terminal de tu master:

```bash
# ==============================================================================
# REEMPLAZA ESTAS 3 VARIABLES CON TUS DATOS ANOTADOS:
# ==============================================================================
MI_RDS_ENDPOINT="agropacayales-rds.c4rhnptakjkc.us-east-1.rds.amazonaws.com"  # <- Tu Dato #1
MI_MONGO_IP="10.0.5.187"                                                      # <- Tu Dato #3 (IP Privada)
MI_RDS_PASS="SQLServer12345"                                                  # <- Tu Dato #2

# ==============================================================================
# EJECUTA ESTE BLOQUE COMPLETO (Genera agropacayales.yml y lo aplica):
# ==============================================================================
cat << EOF > ~/agropacayales.yml
apiVersion: v1
kind: Namespace
metadata:
  name: agropacayales-namespace
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: agropacayales-configmap
  namespace: agropacayales-namespace
data:
  SERVER_PORT: "8081"
  SPRING_PROFILES_ACTIVE: "cloud"
  MONGO_DATABASE: "agropacayales_db"
  SQL_HOST: "${MI_RDS_ENDPOINT}"
  SQL_SERVER: "${MI_RDS_ENDPOINT}"
  SQL_PORT: "1433"
  SQL_DATABASE: "agropacayales_db"
  SQL_USERNAME: "admin"
  SQL_USER: "admin"
  R2DBC_URL: "r2dbc:sqlserver://${MI_RDS_ENDPOINT}:1433/agropacayales_db?sendStringParametersAsUnicode=false"
  ANALYTICS_URL: "http://backend2-service:5000"
---
apiVersion: v1
kind: Secret
metadata:
  name: agropacayales-secret
  namespace: agropacayales-namespace
type: Opaque
stringData:
  MONGO_URI: "mongodb://admin:Mongo12345@${MI_MONGO_IP}:27017/agropacayales_db?authSource=admin"
  SQL_PASSWORD: "${MI_RDS_PASS}"
  SQL_SERVER_PASSWORD: "${MI_RDS_PASS}"
  SQL_USERNAME: "admin"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend1-deployment
  namespace: agropacayales-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend1
  template:
    metadata:
      labels:
        app: backend1
    spec:
      containers:
        - name: backend1
          image: hugo454/agropacayales-backend1:2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8081
          envFrom:
            - configMapRef:
                name: agropacayales-configmap
            - secretRef:
                name: agropacayales-secret
---
apiVersion: v1
kind: Service
metadata:
  name: backend1-service
  namespace: agropacayales-namespace
spec:
  type: NodePort
  selector:
    app: backend1
  ports:
    - port: 8081
      targetPort: 8081
      nodePort: 30001
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend2-deployment
  namespace: agropacayales-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend2
  template:
    metadata:
      labels:
        app: backend2
    spec:
      containers:
        - name: backend2
          image: hugo454/agropacayales-backend-analitico:2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 5000
          envFrom:
            - configMapRef:
                name: agropacayales-configmap
            - secretRef:
                name: agropacayales-secret
---
apiVersion: v1
kind: Service
metadata:
  name: backend2-service
  namespace: agropacayales-namespace
spec:
  type: NodePort
  selector:
    app: backend2
  ports:
    - port: 5000
      targetPort: 5000
      nodePort: 30002
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: agropacayales-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: hugo454/agropacayales-frontend:2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: agropacayales-namespace
spec:
  type: NodePort
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
      nodePort: 30000
EOF

kubectl apply -f ~/agropacayales.yml
```

### 4.5. Verificar que los 3 Pods estén en `Running 1/1`
```bash
kubectl get pods -n agropacayales-namespace
```
*(Debes ver `backend1`, `backend2` y `frontend` en estado **`1/1 Running`**)*.

---

## 🪣 PASO 5: Servicio AWS #4 — Amazon S3 (Frontend Web Serverless)

### 5.1. Compilar el Frontend apuntando a tu IP Elástica
En tu computadora, abre la terminal en la carpeta raíz del proyecto (`e:\...\tcc`) y corre:
```cmd
build-s3.bat <TU_IP_ELASTICA_MASTER>
```
*(Reemplaza `<TU_IP_ELASTICA_MASTER>` por tu Dato #5, ej: `build-s3.bat 100.55.148.151`). Esto compila y genera la carpeta `ASE251S3_T05-fe\dist`.*

### 5.2. Crear Bucket S3 y Habilitar Static Website Hosting
1. En AWS busca **S3** → **Create bucket**:
   * **Nombre:** `agropacayales-frontend-<tu-nombre>` *(debe ser único en todo AWS; anótalo en el Dato #6)*.
   * **Block Public Access:** **Desmarca** *"Block all public access"* y confirma la advertencia.
   * Clic en **Create bucket**.
2. **Static website hosting:** Entra a tu bucket → pestaña **Properties** → baja hasta **Static website hosting** → **Edit**:
   * Selecciona **Enable** | Tipo: *Host a static website*.
   * **Index document:** `index.html` | **Error document:** `index.html`.
   * Clic en **Save changes**.
3. **Política Pública:** Pestaña **Permissions** → **Bucket policy** → **Edit**:
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::<NOMBRE_DE_TU_BUCKET>/*"
           }
       ]
   }
   ```
   *(Reemplaza `<NOMBRE_DE_TU_BUCKET>` por tu Dato #6 y haz clic en **Save changes**. Ignora cualquier aviso cosmético de access-analyzer)*.

### 5.3. Subir los Archivos al Bucket
1. En tu bucket, entra a la pestaña **Objects** (Objetos) → **Upload** (Cargar).
2. Sube **todo el contenido que está adentro de `ASE251S3_T05-fe\dist\`**:
   * `index.html`
   * Carpeta `assets`
   * Carpeta `images`
   * `favicon.svg`, `icono.png`, `icons.svg`
3. Clic en el botón naranja **Upload**.
4. ¡Listo! Abre tu web en:  
   👉 `http://<NOMBRE_DE_TU_BUCKET>.s3-website-us-east-1.amazonaws.com`

---

## 📋 PASO 6: Catálogo de Payloads JSON para CRUD de Maestros (Swagger UI)

Accede a Swagger UI en: **`http://<TU_IP_ELASTICA_MASTER>:30001/swagger-ui.html`**.

### 6.1. Insumos Agrícolas (MongoDB: Colección `supplies`)
Ruta Base: `/api/insumos`

#### Crear Insumo (`POST /api/insumos`):
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

#### Actualizar Insumo (`PUT /api/insumos/INS-FERT-999`):
```json
{
  "id": "INS-FERT-999",
  "nombre": "Nitrato de Calcio Grado Fertirriego Premium Plus",
  "descripcion": "Fórmula mejorada con boro soluble para brotación y cuaje de floración",
  "precio": 94.00,
  "stock": 180.0,
  "unidadMedida": "KG",
  "tipoInsumo": "Fertilizante",
  "categoria": "Fertirriego",
  "proveedor": "Yara Perú S.A.C.",
  "estado": true
}
```

---

### 6.2. Parcelas de Cultivo (MongoDB: Colección `plots`)
Ruta Base: `/api/parcelas`

#### Crear Parcela (`POST /api/parcelas`):
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
  "observaciones": "Monitoreo fenológico semanal mediante inspección agronómica en campo.",
  "enUso": true,
  "estado": true
}
```

#### Actualizar Parcela (`PUT /api/parcelas/PARC-SUR-888`):
```json
{
  "id": "PARC-SUR-888",
  "nombre": "Sector Sur - Parcela Experimental 888 Alta Densidad",
  "ubicacion": "Fundo AgroPacayales, Lote 14 Valle de Cañete",
  "areaHectareas": 5.20,
  "hectareas": 5.20,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Ana Félix",
  "estadoRiego": "Activo",
  "cultivoActual": "Palto Hass",
  "produccionEstimada": "38 Toneladas",
  "fechaUltimaSiembra": "2026-04-10",
  "observaciones": "Poda de formación ejecutada y riego presurizado optimizado a 2.2 bar.",
  "enUso": true,
  "estado": true
}
```

---

### 6.3. Cultivos y Cosechas (Amazon RDS SQL Server)

#### Crear Cultivo en SQL Server (`POST /api/cultivos`):
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

#### Registrar Cosecha en SQL Server (`POST /api/harvest`):
```json
{
  "parcelaId": "PARC-SUR-888",
  "cultivoId": 1,
  "fechaCosecha": "2026-10-25T08:00:00",
  "kilosTotales": 4250.75,
  "kilosPrimera": 3800.00,
  "kilosSegunda": 350.75,
  "kilosMerma": 100.00,
  "responsable": "Axel Huapaya",
  "observaciones": "Cosecha en horas de la mañana con temperatura fresca para exportación."
}
```

---

### 6.4. Fichas de Campo y Cuaderno Técnico (MongoDB: `field_records`)
Ruta Base: `/api/fichas-campo`

#### Crear Ficha de Campo (`POST /api/fichas-campo`):
```json
{
  "id": "FICHA-2026-001",
  "parcelaId": "PARC-SUR-888",
  "cultivo": "Palto Hass",
  "etapaFenologica": "Floración",
  "porcentajeDesarrollo": 65,
  "temperaturaCampo": "24.5°C",
  "clima": "Soleado",
  "humedadSuelo": "Óptima (Riego por goteo activo)",
  "vigor": "Excelente",
  "sanidad": "Sin plagas activas",
  "diagnosticoTecnico": "Excelente brotación floral con presencia activa de polinizadores. Mantener régimen hídrico.",
  "evaluador": "Hugo Fernández",
  "fechaInspeccion": "2026-10-26"
}
```

---

## 🎓 7. Guion de Sustentación para la Evaluación Intermedia (20/20)

Al defender ante el jurado o docente, muestra los 4 servicios en este orden cronológico:

### 1. Evidencia de Red y Seguridad (Amazon VPC)
* Abre la consola de **Amazon VPC** y muestra `agropacayales-vpc` (`10.0.0.0/16`).
* Muestra las 2 subredes públicas y el Security Group `agropacayales-sg`.
* Explica: *"Profesor, diseñamos una VPC aislada que separa y asegura el tráfico interno entre Kubernetes, RDS y MongoDB sin exponer puertos innecesarios a internet"*.

### 2. Evidencia de las 2 Bases de Datos (Amazon RDS + EC2 MongoDB)
* **RDS:** Muestra la consola de **Amazon RDS** con `agropacayales-rds` y en Azure Data Studio ejecuta:  
  `SELECT TOP 10 * FROM agropacayales_db.dbo.cultivos;`.
* **MongoDB:** Muestra la consola de **EC2** con `ec2-mongodb` y abre **MongoDB Compass** mostrando las colecciones `supplies`, `plots` y `field_records`.

### 3. Evidencia de los 2 Backends en Kubernetes (Amazon EC2)
* Muestra la terminal SSH de `k8s-master` ejecutando:
  ```bash
  kubectl get pods -n agropacayales-namespace
  ```
  *(Señala que los 3 pods están en `Running 1/1`)*.
* Abre en vivo ambos Swagger interactivos:
  * **Backend 1:** `http://<TU_IP_ELASTICA>:30001/swagger-ui.html` → Ejecuta `GET /api/cultivos` y `GET /api/parcelas`.
  * **Backend 2:** `http://<TU_IP_ELASTICA>:30002/docs` \| `/health` → Ejecuta `GET /health` mostrando que ambas bases de datos están `UP`.

### 4. Evidencia del Frontend Web en Amazon S3
* Muestra el bucket en **Amazon S3** con *Static website hosting* activo.
* Abre la URL `s3-website` e inicia sesión en vivo: `ana.felix@agropacayales.com` / `Pass123!`.
* Navega por los módulos demostrando la interacción en tiempo real con las parcelas, insumos y el monitor fenológico.

### 5. Demostración de Resiliencia en Kubernetes (Bonus Jurado)
```bash
# Elimina el pod del backend y demuestra que se auto-repara en segundos:
kubectl delete pod -l app=backend1 -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace -w

# Escala dinámicamente a 3 réplicas:
kubectl scale deployment backend1-deployment --replicas=3 -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace
```

---

## 🛠️ 8. Solucionario Rápido de Errores Comunes (Cheat Sheet)

| Síntoma / Error | Causa Probable | Solución Inmediata |
| :--- | :--- | :--- |
| **`Failed to obtain R2DBC Connection`** | Las variables del Secret no coinciden con `SQL_PASSWORD` o el puerto 1433 está bloqueado. | Aplica el bloque del paso 4.4 definiendo `MI_RDS_ENDPOINT` y `MI_RDS_PASS`. Revisa que el SG de RDS permita el puerto 1433. |
| **`Backend 2 no responde en 30002`** | El servicio de K8s apuntaba al puerto 8000 en vez de 5000. | Usa el manifiesto del paso 4.4 que ya mapea `targetPort: 5000`. |
| **Pods en estado `Pending`** | Falta etiqueta de rol o hay 1 sola máquina master. | Quita el filtro de nodo aplicando el manifiesto unificado del paso 4.4. |
| **`access-analyzer:ValidatePolicy` en S3** | Falta de permisos IAM del linter de AWS Academy en Voclabs. | Es una advertencia cosmética. Asegúrate de tener *Block Public Access* en *Off* y haz clic en *Save changes*. |
| **`useConnectionInfo hook` en Compass** | Glitch visual de renderizado en pestañas viejas de Compass. | Cierra la pestaña con la `x`, haz clic en otra colección o presiona `Ctrl + R`. |
| **`ECONNREFUSED` en MongoDB** | `bindIp` sigue en `127.0.0.1` o falta el parche de kernel `rseq=1`. | Ejecuta el bloque del paso 3.2 que aplica el parche y reinicia `mongod`. |
| **La IP pública cambia al apagar AWS** | Las instancias EC2 reciben IP dinámica por defecto. | Asocia una **IP Elástica (Elastic IP)** a `k8s-master` siguiendo el paso 4.2. |
