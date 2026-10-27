# 🚀 MANUAL DE DESPLIEGUE: 4 SERVICIOS AWS (VPC + EC2 + RDS + S3)
## Unidad Didáctica: Taller de Cloud Computing — Evaluación Intermedia
### Proyecto: AgroPacayales S.A.C. (Equipo T05)

---

## 🎯 1. Matriz de Cumplimiento de Rúbrica Oficial (20/20)

Esta arquitectura está 100% optimizada para el entorno de **AWS Academy (Voclabs)**, sin errores de permisos IAM ni bloqueos de políticas:

| Criterio de la Rúbrica | Componente Aprovisionado | Servicio AWS Empleado | Categoría Oficial AWS | Justificación para la Evaluación |
| :--- | :--- | :--- | :--- | :--- |
| **Criterio 1: 2 Bases de Datos empleando 2 servicios diferentes de AWS** | **BD 1 (Relacional):** SQL Server Express 2022 (`agropacayales_db`)<br><br>**BD 2 (NoSQL):** MongoDB 8.0 nativo (`agropacayales_db`) | **Amazon RDS**<br><br>**Amazon EC2** (`ec2-mongodb`) | *Database* (PaaS Relacional)<br><br>*Compute* (IaaS con Motor NoSQL dedicado) | BD relacional administrada para transacciones ACID (puerto 1433) y servidor NoSQL dedicado para insumos, parcelas y bitácora fenológica (puerto 27017). |
| **Criterio 2: 2 Backends empleando mínimo 1 servicio de AWS** | **Backend 1:** Spring Boot Java 17 (`:8081`)<br>**Backend 2:** Python FastAPI (`:8000`) | **Amazon EC2** (Clúster K3s) | *Compute* (IaaS / Contenedores) | Microservicios orquestados en contenedores con alta disponibilidad en los nodos dedicados K3s (NodePorts `30001` y `30002`). |
| **Criterio 3: Frontend Web empleando 1 servicio diferente a los anteriores** | **Frontend Web:** React 19 + TypeScript + Vite SPA | **Amazon S3** (Static Website) | *Storage* (Almacenamiento de Objetos) | Hosting desacoplado, estático y serverless en S3, completamente diferente a cómputo y bases de datos. |
| **Criterio 4: Mínimo 4 servicios diferentes de AWS en total** | **Infraestructura de Red y Conectividad** | **Amazon VPC** | *Networking & Content Delivery* | Red privada virtual (`10.0.0.0/16`) creada desde cero con subredes públicas, Internet Gateway y Security Groups para interconectar todo. |

> 💡 **Nota de Sustentación:** En la evaluación cuentas con **4 servicios oficiales nativos de AWS**:  
> 1. **Amazon VPC** (Networking)  
> 2. **Amazon EC2** (Compute)  
> 3. **Amazon RDS** (Database)  
> 4. **Amazon S3** (Storage)  
> Además, demuestras el frontend en **Amazon S3** (para la rúbrica) y el frontend en **K3s** (para la auto-reparación de Kubernetes ante el jurado).

---

## 🌐 2. Matriz Rápida de Puertos y URLs Públicas

| Componente | Servicio AWS | Puerto / Tipo | URL Pública / Endpoint | Credenciales / Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **Red Privada** | **Amazon VPC** | Red `10.0.0.0/16` | Consola VPC (`agropacayales-vpc`) | 2 subredes públicas + Internet Gateway |
| **Frontend Web (S3)** | **Amazon S3** | 80 (HTTP) | `http://<bucket-name>.s3-website-us-east-1.amazonaws.com` | **Frontend oficial en 4to servicio AWS** |
| **Frontend Web (K3s)**| **Amazon EC2** | 30000 (NodePort) | `http://<IP_MASTER>:30000` | Acceso directo vía clúster Kubernetes |
| **Backend 1 (Transaccional)** | **Amazon EC2** | 30001 (NodePort) | `http://<IP_MASTER>:30001/swagger-ui.html` | Swagger UI interactivo Spring Boot |
| **Backend 2 (Analítico)** | **Amazon EC2** | 30002 (NodePort) | `http://<IP_MASTER>:30002/docs` | OpenAPI interactivo FastAPI |
| **BD Relacional** | **Amazon RDS** | 1433 (TCP) | `<endpoint-rds>.amazonaws.com:1433` | Usuario: `admin` \| Pass: `SQLServer12345` |
| **BD NoSQL** | **Amazon EC2** | 27017 (TCP) | `<IP_PRIVADA_MONGO>:27017` | Usuario: `admin` \| Pass: `Mongo12345` |
| **App Móvil (Expo)** | React Native | Local / Web | `http://localhost:8081` | Conectado a `http://<IP_MASTER>:30001` |

---

## 🌐 PASO 1: Servicio AWS #1 — Amazon VPC (Creación desde cero en 2 min)

Creamos la red privada virtual oficial con el asistente automatizado de AWS:

### 1.1. Crear la VPC con el Asistente "VPC y más"
1. En la consola de AWS, busca **VPC** y haz clic en el botón naranja **Crear VPC** (*Create VPC*).
2. Arriba selecciona la opción: 👉 **"VPC y más"** (*VPC and more*).
3. Configuración:
   * **Generación automática de etiquetas de nombre:** `agropacayales-vpc`
   * **Bloque de CIDR IPv4:** `10.0.0.0/16`
   * **Número de zonas de disponibilidad (AZ):** `2` *(RDS exige mínimo 2 zonas)*.
   * **Número de subredes públicas:** `2`
   * **Número de subredes privadas:** `0` *(Cero, para no pagar NAT Gateway)*.
   * **Pasarelas NAT:** `Ninguna` (*None*).
   * **Extremos de VPC:** `Ninguno` (*None*).
4. Verás el diagrama con las 2 subredes públicas y el Internet Gateway. Haz clic en **Crear VPC**.

### 1.2. Habilitar nombres de host DNS en la VPC (Obligatorio)
1. En el menú izquierdo de VPC, entra a **Tus VPC** (*Your VPCs*).
2. Selecciona `agropacayales-vpc` → **Acciones** (*Actions*) → **Editar la configuración de la VPC** (*Edit VPC settings*).
3. Marca ambas casillas:
   * ☑️ **Habilitar la resolución de DNS** (*Enable DNS resolution*).
   * ☑️ **Habilitar nombres de host de DNS** (*Enable DNS hostnames*).
4. Haz clic en **Guardar cambios**.

### 1.3. Habilitar IPs públicas automáticas en las Subredes
1. En el menú izquierdo de VPC, entra a **Subredes** (*Subnets*).
2. Selecciona la primera subred (`agropacayales-subnet-public1`) → **Acciones** → **Editar la configuración de la subred** (*Edit subnet settings*).
3. Marca la casilla: ☑️ **Habilitar la asignación automática de direcciones IPv4 públicas**.
4. Haz clic en **Guardar**.
5. Repite el mismo paso con la segunda subred (`agropacayales-subnet-public2`).

### 1.4. Crear el Security Group Unificado en tu VPC
1. En el menú izquierdo de VPC, entra a **Grupos de seguridad** (*Security Groups*) → **Crear grupo de seguridad**.
2. **Nombre:** `agropacayales-sg` | **Descripción:** `Security Group AgroPacayales`
3. **VPC:** Selecciona tu **`agropacayales-vpc`**.
4. En **Reglas de entrada** (*Inbound rules*), agrega:
   * **SSH:** Puerto `22`, Origen `0.0.0.0/0`.
   * **TCP personalizado:** Puerto `30000-30002`, Origen `0.0.0.0/0`.
   * **TCP personalizado:** Puerto `1433` (SQL Server), Origen `0.0.0.0/0`.
   * **TCP personalizado:** Puerto `27017` (MongoDB), Origen `0.0.0.0/0`.
   * **Todo el tráfico:** Origen `agropacayales-sg` *(para la red interna entre pods y K3s)*.
5. Haz clic en **Crear grupo de seguridad**.

---

## 🗄️ PASO 2: Servicio AWS #2 — Amazon RDS (SQL Server Express)

Configurado específicamente para **evitar errores de permisos IAM en AWS Academy (Voclabs)**:

### 2.1. Crear la Base de Datos en AWS RDS
1. En la consola de AWS, busca **RDS** y haz clic en **Create database** (Creación estándar).
2. **Motor:** `Microsoft SQL Server` → **Edición:** `SQL Server Express Edition`.
3. **Identificador de instancia:** `agropacayales-rds`.
4. **Master username:** `admin`.
5. **Master password:** `SQLServer12345`.
6. **Clase de instancia:** Selecciona 👉 **`db.t3.micro`** (1 vCPU, 1 GB RAM). *(¡No uses otra clase!)*.
7. **Almacenamiento:**
   * Tipo: `General Purpose SSD (gp2 o gp3)`.
   * Almacenamiento asignado: `20 GiB`.
   * ❌ **DESMARCA:** "Habilitar el escalado automático del almacenamiento" (*Enable storage autoscaling*).
8. **Conectividad:**
   * **Virtual Private Cloud (VPC):** Selecciona tu **`agropacayales-vpc`**.
   * **Acceso público:** `Yes` (para conectarte directo desde tu PC) o `No` (con túnel SSH).
   * **VPC security group:** Selecciona **`agropacayales-sg`** (y retira el default si está marcado).
9. **Monitoreo (CRÍTICO para evitar error de permisos Voclabs):**
   * ❌ **DESMARCA:** "Habilitar el monitoreo mejorado" (*Enable Enhanced Monitoring*).
10. **Configuración adicional:**
    * ❌ **DESMARCA:** "Habilitar Performance Insights".
    * En **Copias de seguridad**: Retención en `0` días (o desmarca copias automatizadas).
11. Haz clic en **Create database**. Cuando esté en estado **Available**, copia el **Endpoint**.

### 2.2. Inicialización de Tablas en RDS
Desde Azure Data Studio, SSMS o DBeaver, conéctate al endpoint de RDS (usuario `admin`, contraseña `SQLServer12345`) y ejecuta:
```sql
CREATE DATABASE agropacayales_db;
GO
USE agropacayales_db;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sale_order')
BEGIN
    CREATE TABLE sale_order (
        id INT IDENTITY(1,1) PRIMARY KEY,
        person_id CHAR(24) NOT NULL,
        warehouse_id CHAR(24) NOT NULL,
        sale_order_date DATETIME DEFAULT GETDATE(),
        status CHAR(1) DEFAULT 'A',
        total DECIMAL(7,2) NOT NULL,
        delivery_type CHAR(2) NOT NULL,
        payment_method CHAR(2) NOT NULL,
        notes NVARCHAR(MAX) NULL
    );
END;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_details')
BEGIN
    CREATE TABLE order_details (
        id INT IDENTITY(1,1) PRIMARY KEY,
        sale_order_id INT NOT NULL,
        product_id CHAR(24) NOT NULL,
        quantity DECIMAL(5,2) NOT NULL,
        sub_total DECIMAL(7,2) NOT NULL
    );
END;
GO
```

---

## ⚙️ PASO 3: Servicio AWS #3 — Amazon EC2 (MongoDB + Clúster K3s)

Todas las instancias se lanzan dentro de tu nueva **`agropacayales-vpc`** con **User Data** automatizado.

### 3.1. Lanzar `ec2-mongodb` (Base de Datos NoSQL con MongoDB 8.0)
1. **EC2** → **Launch Instance**:
   * **Nombre:** `ec2-mongodb`
   * **AMI:** Ubuntu Server 24.04 LTS (x86_64) | **Tipo:** `t3.small` o `t3.micro`.
   * **Network Settings** (Editar):
     * **VPC:** `agropacayales-vpc`
     * **Subred:** Cualquiera de las 2 públicas.
     * **Auto-assign public IP:** Habilitado.
     * **Security Group:** `agropacayales-sg`.
   * **Advanced details** → **User data** (Pega este script completo):
     ```bash
     #!/bin/bash
     apt update && apt install -y gnupg curl
     curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
     echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
     apt update && apt install -y mongodb-org
     mkdir -p /etc/systemd/system/mongod.service.d
     printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' | tee /etc/systemd/system/mongod.service.d/rseq.conf
     sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
     systemctl daemon-reload && systemctl enable --now mongod
     mongosh --eval 'db.getSiblingDB("admin").createUser({user:"admin",pwd:"Mongo12345",roles:["root"]})'
     printf "\nsecurity:\n  authorization: enabled\n" | tee -a /etc/mongod.conf
     systemctl restart mongod
     ```
2. Haz clic en **Launch instance**. Copia su **IP privada** (ej: `10.0.0.85`).

---

### 3.2. Lanzar `k8s-master` (Control Plane K3s)
1. **EC2** → **Launch Instance**:
   * **Nombre:** `k8s-master`
   * **AMI:** Ubuntu 24.04 LTS | **Tipo:** `t3.small` o `t3.medium`.
   * **Network Settings:** VPC `agropacayales-vpc`, Subred pública, Security Group `agropacayales-sg`.
   * **Advanced details** → **User data**:
     ```bash
     #!/bin/bash
     export K3S_TOKEN="agropacayales-token-2026"
     curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--token ${K3S_TOKEN} --write-kubeconfig-mode 644" sh -
     mkdir -p /home/ubuntu/.kube
     cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
     chown -R ubuntu:ubuntu /home/ubuntu/.kube
     echo 'alias k="kubectl"' >> /home/ubuntu/.bashrc
     ```
2. Haz clic en **Launch instance**. Copia su **IP privada** (ej: `10.0.0.210`) y su **IP pública** (ej: `3.88.182.11`).

---

### 3.3. Lanzar los 3 Nodos Workers K3s (Con Auto-Etiquetado)
Lanza cada worker en la VPC `agropacayales-vpc` con `agropacayales-sg` pegando su respectivo script de User Data (reemplaza `IP_PRIVADA_MASTER` por la IP privada real de `k8s-master`):

* **Nodo 1: `k8s-node-backend` (`t3.medium`):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=backend1" sh -
  ```
* **Nodo 2: `k8s-node-backendAnalitico` (`t3.small`):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=backend2" sh -
  ```
* **Nodo 3: `k8s-node-frontend` (`t3.small`):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=frontend" sh -
  ```

---

### 3.4. Aplicar el Despliegue de K8s en `k8s-master`
Conéctate por SSH a `k8s-master`:
```bash
ssh -i "tu-llave.pem" ubuntu@<IP_PUBLICA_MASTER>
```
Crea el manifiesto unificado:
```bash
cat << 'EOF' > ~/agropacayales.yml
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
  MONGO_DATABASE: agropacayales_db
  SQL_SERVER_HOST: "ENDPOINT_DE_RDS"
  SQL_SERVER_PORT: "1433"
  SQL_SERVER_DATABASE: agropacayales_db
---
apiVersion: v1
kind: Secret
metadata:
  name: agropacayales-secret
  namespace: agropacayales-namespace
type: Opaque
stringData:
  MONGO_URI: "mongodb://admin:Mongo12345@IP_PRIVADA_MONGO:27017/agropacayales_db?authSource=admin"
  SQL_SERVER_USERNAME: "admin"
  SQL_SERVER_PASSWORD: "SQLServer12345"
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
      nodeSelector:
        role: backend1
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
      nodeSelector:
        role: backend2
      containers:
        - name: backend2
          image: hugo454/agropacayales-backend-analitico:2.0
          imagePullPolicy: Always
          ports:
            - containerPort: 8000
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
    - port: 8000
      targetPort: 8000
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
      nodeSelector:
        role: frontend
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
```
Reemplaza los valores reales y aplica:
```bash
sed -i 's/ENDPOINT_DE_RDS/<tu-endpoint-rds>/g' ~/agropacayales.yml
sed -i 's/IP_PRIVADA_MONGO/<ip-privada-de-ec2-mongodb>/g' ~/agropacayales.yml
kubectl apply -f ~/agropacayales.yml
kubectl get pods -n agropacayales-namespace -o wide
```

---

## 🪣 PASO 4: Servicio AWS #4 — Amazon S3 (Frontend Web en Servicio Diferente)

### 4.1. Compilar el Frontend apuntando a tu clúster AWS
En tu computadora, abre la terminal en la raíz del proyecto y corre:
```cmd
build-s3.bat <IP_PUBLICA_MASTER>
```
*(Ejemplo: `build-s3.bat 3.88.182.11`). Esto compila y genera la carpeta `ASE251S3_T05-fe\dist`.*

### 4.2. Crear y Configurar el Bucket en Amazon S3
1. En la consola de AWS, busca **S3** → **Create bucket**.
2. **Bucket name:** `agropacayales-frontend-t05` *(debe ser único)*.
3. **Block Public Access:** **Desmarca** la casilla *"Block all public access"* y confirma la advertencia.
4. Clic en **Create bucket**.

### 4.3. Habilitar Static Website Hosting
1. Entra a tu bucket → Pestaña **Properties** (Propiedades).
2. Baja hasta el final a **Static website hosting** → **Edit**.
3. Selecciona **Enable** y tipo *Host a static website*.
4. **Index document:** `index.html` | **Error document:** `index.html`.
5. Clic en **Save changes**.

### 4.4. Asignar Política de Lectura Pública
En la pestaña **Permissions** (Permisos) → **Bucket policy** → **Edit**:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::agropacayales-frontend-t05/*"
        }
    ]
}
```
*(Cambia `agropacayales-frontend-t05` por el nombre real de tu bucket y guarda cambios)*.

### 4.5. Subir los Archivos al Bucket
1. En tu bucket, entra a la pestaña **Objects** (Objetos) → **Upload** (Cargar).
2. Sube **todo el contenido que está adentro de `ASE251S3_T05-fe\dist\`**:
   * `index.html`
   * Carpeta `assets`
   * Carpeta `images`
   * `favicon.svg`, `icono.png`, `icons.svg`
3. Clic en el botón naranja **Upload**.
4. ¡Listo! Abre la URL pública:
   👉 `http://agropacayales-frontend-t05.s3-website-us-east-1.amazonaws.com`

---

## 📱 PASO 5: Conexión de la App Móvil (Expo React Native)

1. En `ASE251S4_T05-mobile/.env` coloca la IP pública de tu master:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_PUBLICA_MASTER>:30001
   ```
2. Ejecuta limpiando caché:
   ```bash
   cd ASE251S4_T05-mobile
   npx expo start -c
   ```
3. Presiona la tecla `w` para simular en el navegador web (`http://localhost:8081`).

---

## 🎓 6. Guion de Sustentación para la Evaluación Intermedia (20/20)

Al defender ante el jurado o docente, muestra los 4 servicios en este orden cronológico:

### 1. Evidencia de Red y Seguridad (Amazon VPC)
* Muestra la consola de **Amazon VPC** con `agropacayales-vpc` (`10.0.0.0/16`).
* Muestra las 2 subredes públicas asociadas y el Security Group `agropacayales-sg`.

### 2. Evidencia de las 2 Bases de Datos (Amazon RDS + EC2 MongoDB)
* **RDS:** Muestra en la consola la instancia `agropacayales-rds` y en Azure Data Studio ejecuta `SELECT * FROM sale_order;`.
* **EC2 MongoDB:** Muestra la instancia `ec2-mongodb` activa en puerto `27017` y la lectura de insumos/parcelas desde Swagger.

### 3. Evidencia de los 2 Backends en Kubernetes (Amazon EC2)
* Muestra la terminal SSH de `k8s-master` ejecutando:
  ```bash
  kubectl get pods -n agropacayales-namespace -o wide
  ```
  *(Señala que Backend 1 corre en `role=backend1` y Backend 2 en `role=backend2`)*.
* Abre en vivo ambos Swagger interactivos:
  * **Backend 1:** `http://<IP_MASTER>:30001/swagger-ui.html`
  * **Backend 2:** `http://<IP_MASTER>:30002/docs`

### 4. Evidencia del Frontend Web en Amazon S3
* Muestra el bucket en **Amazon S3** con *Static website hosting* activo.
* Abre la URL `s3-website` e inicia sesión en vivo: `ana.felix@agropacayales.com` / `Pass123!`.
* Demuestra la interacción en vivo con las parcelas y el monitor fenológico.

### 5. Demostración de Resiliencia en Kubernetes (Bonus)
```bash
# Elimina el pod del backend y demuestra que se auto-repara en segundos:
kubectl delete pod -l app=backend1 -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace -w

# Escala dinámicamente a 3 réplicas:
kubectl scale deployment backend1-deployment --replicas=3 -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace
```
