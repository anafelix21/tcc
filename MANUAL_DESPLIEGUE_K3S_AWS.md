# 🚀 MANUAL DE DESPLIEGUE: 4 SERVICIOS AWS
## Unidad Didáctica: Taller de Cloud Computing — Evaluación Intermedia
### Proyecto: AgroPacayales S.A.C. (Equipo T05)

---

## 🎯 1. Matriz de Cumplimiento de Rúbrica Oficial (4 Servicios AWS)

Este manual garantiza el **100% de la calificación (20/20)** en la Evaluación Intermedia al aprovisionar la arquitectura empleando **4 servicios diferentes de AWS**:

| Criterio de la Rúbrica | Componente Aprovisionado | Servicio AWS Empleado | Tipo de Servicio | Descripción Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **Criterio 1: 2 Bases de Datos empleando 2 servicios diferentes de AWS** | **BD 1 (Relacional):** SQL Server Express 2022 (`agropacayales_db`) | **Amazon RDS** | PaaS (Database Relacional) | Base de datos relacional administrada con transacciones ACID para pedidos, stock y fincas en puerto `1433`. |
| | **BD 2 (NoSQL):** MongoDB 8.0 (`agropacayales_db`) | **Amazon DocumentDB** *(o EC2 dedicado)* | PaaS (Database NoSQL) | Motor de base de datos documental compatible con MongoDB para insumos, bitácoras fenológicas y fichas en puerto `27017`. |
| **Criterio 2: 2 Backends empleando mínimo 1 servicio de AWS** | **Backend 1:** Spring Boot Java 17 (`:8081`)<br>**Backend 2:** Python FastAPI (`:8000`) | **Amazon EC2** | IaaS (Cómputo / Orquestación K3s) | Instancias EC2 configuradas con clúster K3s de alta disponibilidad ejecutando microservicios en NodePorts `30001` y `30002`. |
| **Criterio 3: Frontend Web empleando 1 servicio diferente a los anteriores** | **Frontend Web:** React 19 + TypeScript + Vite SPA | **Amazon S3** | Storage (Almacenamiento de Objetos / Web) | Alojamiento serverless en S3 con *Static Website Hosting*, desacoplado y diferente a cómputo y bases de datos. |
| **Criterio 4: Mínimo 4 servicios diferentes de AWS** | **Arquitectura Completa Integrada** | **RDS + DocumentDB + EC2 + S3** | 4 Servicios Nativos | Integración total entre almacenamiento estático (S3), orquestación de cómputo (EC2), BD relacional (RDS) y BD NoSQL (DocumentDB). |

> 💡 **Nota de Resiliencia en Evaluación:** El Frontend Web también se encuentra desplegado en K3s (puerto `30000`). En la sustentación puedes mostrar **Amazon S3** para sustentar el 4to servicio de AWS y el Frontend en **K3s** para sustentar la orquestación y tolerancia a fallos de Kubernetes.

---

## 🌐 2. Matriz Rápida de Puertos y URLs Públicas

| Componente | Servicio AWS | Puerto / Tipo | URL Pública / Endpoint | Credenciales / Notas |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Web (S3)** | **Amazon S3** | 80 (HTTP) | `http://<bucket-name>.s3-website-us-east-1.amazonaws.com` | **Frontend oficial en 4to servicio AWS** |
| **Frontend Web (K3s)** | **Amazon EC2** | 30000 (NodePort) | `http://<IP_PUBLICA_EC2>:30000` | Acceso directo vía clúster Kubernetes |
| **Backend 1 (Transaccional)** | **Amazon EC2** | 30001 (NodePort) | `http://<IP_PUBLICA_EC2>:30001/swagger-ui.html` | Swagger UI interactivo Spring Boot |
| **Backend 2 (Analítico)** | **Amazon EC2** | 30002 (NodePort) | `http://<IP_PUBLICA_EC2>:30002/docs` | OpenAPI / Swagger interactivo FastAPI |
| **BD Relacional** | **Amazon RDS** | 1433 (TCP) | `<endpoint-rds>.amazonaws.com:1433` | Usuario: `admin` \| Pass: `SQLServer12345` |
| **BD NoSQL** | **Amazon DocumentDB** | 27017 (TCP) | `<endpoint-docdb>.amazonaws.com:27017` | Usuario: `admin` \| Pass: `Mongo12345` |
| **App Móvil (Expo)** | React Native | Local / Web | `http://localhost:8081` | Conectado a `http://<IP_PUBLICA_EC2>:30001` |

---

## 🛡️ 3. Configuración Inicial en AWS: Security Group Unificado

Para evitar bloqueos de red o errores de permisos entre las instancias, crea un **único Security Group**:

* **Nombre:** `agropacayales-sg`
* **VPC:** `default` (la VPC por defecto)
* **Reglas de Entrada (Inbound Rules):**

| Tipo | Protocolo | Rango de Puertos | Origen | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `0.0.0.0/0` | Acceso por terminal SSH |
| **NodePorts K3s** | TCP | `30000 - 30002` | `0.0.0.0/0` | Acceso público a Frontend, Backend 1 y Backend 2 |
| **API Server K3s** | TCP | `6443` | `0.0.0.0/0` (o `agropacayales-sg`) | Comunicación entre Master y Workers K3s |
| **Kubelet** | TCP | `10250` | `agropacayales-sg` | Métricas y control de pods K3s |
| **Flannel VXLAN** | UDP | `8472` | `agropacayales-sg` | Red overlay interna entre pods |
| **SQL Server** | TCP | `1433` | `0.0.0.0/0` (o `agropacayales-sg`) | Conexión hacia Amazon RDS |
| **MongoDB / DocDB**| TCP | `27017` | `0.0.0.0/0` (o `agropacayales-sg`) | Conexión hacia DocumentDB o MongoDB |

---

## 🗄️ PASO 1: Servicio AWS #1 — Amazon RDS (SQL Server)

1. En la consola de AWS, busca el servicio **RDS** y haz clic en **Create database** (Creación estándar).
2. Configuración:
   * **Engine:** `Microsoft SQL Server` → Edición: `SQL Server Express Edition`.
   * **DB instance class:** `db.t3.micro` (1 vCPU, 1 GB RAM).
   * **Master username:** `admin`.
   * **Master password:** `SQLServer12345`.
   * **Public access:** `No` (o `Yes` si deseas conectarte directo desde tu PC sin túnel).
   * **Security Group:** Selecciona `agropacayales-sg`.
3. Haz clic en **Create database**. Cuando esté en estado **Available**, copia el **Endpoint** (ejemplo: `agropacayales-rds.c123456.us-east-1.rds.amazonaws.com`).
4. **Inicialización de la Base de Datos:**
   Conéctate desde Azure Data Studio o SQL Server Management Studio (usando la IP del master como túnel o acceso directo) y ejecuta:
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

## 🍃 PASO 2: Servicio AWS #2 — Amazon DocumentDB (MongoDB NoSQL)

Para cumplir con el criterio de **2 bases de datos en 2 servicios diferentes de AWS**, aprovisionamos **Amazon DocumentDB** (servicio NoSQL nativo de AWS compatible con MongoDB):

1. En la consola de AWS, busca el servicio **Amazon DocumentDB** y haz clic en **Create cluster**.
2. Configuración:
   * **Cluster identifier:** `agropacayales-docdb`.
   * **Engine version:** `5.0.0` (o `4.0.0`).
   * **Instance class:** `db.t3.medium`.
   * **Number of instances:** `1` (suficiente para pruebas de evaluación).
   * **Master username:** `admin`.
   * **Master password:** `Mongo12345`.
   * **Security Group:** Selecciona `agropacayales-sg`.
3. Haz clic en **Create cluster**.
4. Una vez disponible, copia el **Cluster Endpoint** (ejemplo: `agropacayales-docdb.cluster-c1234.us-east-1.docdb.amazonaws.com`).
5. La URI de conexión para el clúster será:
   ```text
   mongodb://admin:Mongo12345@<docdb-endpoint>:27017/agropacayales_db?tls=false&authSource=admin
   ```

> ⚠️ **Opción Alternativa (Si tu cuenta de AWS Academy tiene bloqueado DocumentDB):**  
> Si tu cuenta académica restringe DocumentDB por cuota, lanza una instancia EC2 `t3.small` llamada `ec2-mongodb` con el siguiente **User Data**, el cual instala MongoDB 8.0 y aplica el parche de kernel automáticamente:
> ```bash
> #!/bin/bash
> apt update && apt install -y gnupg curl
> curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
> echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
> apt update && apt install -y mongodb-org
> mkdir -p /etc/systemd/system/mongod.service.d
> printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' | tee /etc/systemd/system/mongod.service.d/rseq.conf
> sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
> systemctl daemon-reload && systemctl enable --now mongod
> mongosh --eval 'db.getSiblingDB("admin").createUser({user:"admin",pwd:"Mongo12345",roles:["root"]})'
> printf "\nsecurity:\n  authorization: enabled\n" | tee -a /etc/mongod.conf
> systemctl restart mongod
> ```

---

## ⚙️ PASO 3: Servicio AWS #3 — Amazon EC2 con K3s (2 Backends)

Aprovisionamos **Amazon EC2** para orquestar los microservicios Backend mediante **K3s**.

### 3.1. Lanzar las Instancias EC2
En la consola de **EC2** → **Launch Instances**:
* **AMI:** Ubuntu Server 24.04 LTS (x86_64).
* **Security Group:** `agropacayales-sg`.
* **Instancias a crear:**
  1. `k8s-master` (`t3.small` o `t3.medium`)
  2. `k8s-node-backend` (`t3.medium`) → Ejecuta Backend 1 (Spring Boot)
  3. `k8s-node-backendAnalitico` (`t3.small`) → Ejecuta Backend 2 (FastAPI)
  4. `k8s-node-frontend` (`t3.small`) → Ejecuta Frontend Nginx en K3s

### 3.2. User Data para `k8s-master` (Automatizado al 100%)
Pega este script en **Advanced details** → **User data** al lanzar `k8s-master`:

```bash
#!/bin/bash
# ==============================================================================
# SCRIPT USER DATA - K3S MASTER AGROPACAYALES
# ==============================================================================
export K3S_TOKEN="agropacayales-token-2026"
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--token ${K3S_TOKEN} --write-kubeconfig-mode 644" sh -

mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
echo 'alias k="kubectl"' >> /home/ubuntu/.bashrc

# Esperar a que K3s inicie completamente
sleep 20
```

### 3.3. User Data para los Workers K3s (Auto-etiquetado)
Al lanzar cada nodo worker, pega su script correspondiente en **User data** (reemplaza `IP_PRIVADA_MASTER` por la IP privada real de `k8s-master`):

* **En `k8s-node-backend` (Backend 1):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=backend1" sh -
  ```

* **En `k8s-node-backendAnalitico` (Backend 2):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=backend2" sh -
  ```

* **En `k8s-node-frontend` (Frontend K3s):**
  ```bash
  #!/bin/bash
  curl -sfL https://get.k3s.io | K3S_URL=https://IP_PRIVADA_MASTER:6443 \
    K3S_TOKEN="agropacayales-token-2026" \
    INSTALL_K3S_EXEC="--node-label role=frontend" sh -
  ```

### 3.4. Desplegar los Backends y Manifiestos desde `k8s-master`
Conéctate por SSH a `k8s-master`:
```bash
ssh -i "tu-llave.pem" ubuntu@<IP_PUBLICA_MASTER>
```
Crea el archivo `agropacayales.yml` con tus endpoints de RDS y DocumentDB:
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
  MONGO_URI: "mongodb://admin:Mongo12345@ENDPOINT_DE_DOCUMENTDB_O_MONGO:27017/agropacayales_db?authSource=admin"
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
Aplica el despliegue con:
```bash
sed -i 's/ENDPOINT_DE_RDS/<tu-endpoint-rds>/g' ~/agropacayales.yml
sed -i 's/ENDPOINT_DE_DOCUMENTDB_O_MONGO/<tu-endpoint-docdb-o-mongo>/g' ~/agropacayales.yml
kubectl apply -f ~/agropacayales.yml
kubectl get pods -n agropacayales-namespace -o wide
```

---

## 🪣 PASO 4: Servicio AWS #4 — Amazon S3 (Frontend Web en Servicio Diferente)

Para cumplir estrictamente con el **Criterio 3 (Frontend Web en 1 servicio diferente a los anteriores)**, desplegamos el Frontend en **Amazon S3** con Static Website Hosting.

### 4.1. Compilación del Frontend apuntando a AWS
En tu PC, abre una terminal en la raíz del proyecto y ejecuta el script automatizado indicando la IP pública de tu EC2 en AWS:
```cmd
build-s3.bat <IP_PUBLICA_EC2_BACKEND>
```
*(Ejemplo: `build-s3.bat 54.210.85.90`). Esto genera la carpeta optimizada `ASE251S3_T05-fe\dist`.*

### 4.2. Crear y Configurar el Bucket en Amazon S3
1. En la consola de AWS, busca **S3** y haz clic en **Create bucket**.
2. **Bucket name:** `agropacayales-frontend-t05` (debe ser único globalmente).
3. **Object Ownership:** Selecciona *ACLs disabled (recommended)*.
4. **Block Public Access settings for this bucket:**
   * **Desmarca** la casilla *"Block all public access"*.
   * Marca la casilla de confirmación de advertencia.
5. Haz clic en **Create bucket**.

### 4.3. Habilitar Static Website Hosting
1. Haz clic en el nombre de tu bucket recién creado → Pestaña **Properties** (Propiedades).
2. Baja hasta el final a **Static website hosting** y haz clic en **Edit**.
3. Selecciona **Enable**.
4. En **Hosting type**, selecciona *Host a static website*.
5. **Index document:** `index.html`
6. **Error document:** `index.html` *(CRÍTICO para que no dé error 404 al navegar en React)*.
7. Haz clic en **Save changes**.

### 4.4. Asignar Política de Lectura Pública
1. En tu bucket, entra a la pestaña **Permissions** (Permisos).
2. En **Bucket policy**, haz clic en **Edit** y pega lo siguiente (reemplaza `NOMBRE_DE_TU_BUCKET`):
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::NOMBRE_DE_TU_BUCKET/*"
        }
    ]
}
```
3. Haz clic en **Save changes**.

### 4.5. Subir los Archivos al Bucket
1. Entra a la pestaña **Objects** (Objetos).
2. Haz clic en **Upload** (Cargar).
3. Arrastra y suelta todos los archivos y carpetas que están dentro de `ASE251S3_T05-fe\dist\` (es decir: `index.html` y la carpeta `assets`).
4. Haz clic en **Upload**.
5. ¡Listo! Vuelve a la pestaña **Properties** → baja a **Static website hosting** y abre la **Bucket website endpoint**:
   ```text
   http://agropacayales-frontend-t05.s3-website-us-east-1.amazonaws.com
   ```

---

## 📱 PASO 5: Conexión de la App Móvil (Expo React Native)

Para conectar la app móvil al Backend en AWS:
1. Abre `ASE251S4_T05-mobile/.env` y coloca la IP pública de tu EC2 en el puerto `30001`:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_PUBLICA_EC2>:30001
   ```
2. Inicia Expo limpiando la caché:
   ```bash
   cd ASE251S4_T05-mobile
   npx expo start -c
   ```
3. Presiona la tecla `w` para abrir la simulación Web en el navegador (`http://localhost:8081`).

---

## 🎓 6. Guion de Sustentación para la Evaluación Intermedia (20/20)

Al defender ante el jurado o docente, muestra los 4 servicios en este orden cronológico para verificar el cumplimiento punto por punto:

### 1. Evidencia de las 2 Bases de Datos en 2 Servicios AWS Diferentes (Criterio 1)
1. **Amazon RDS (Relacional):**
   * Muestra la consola de **Amazon RDS** con la instancia `agropacayales-rds` en estado *Available*.
   * Abre Azure Data Studio conectado al endpoint de RDS y ejecuta: `SELECT * FROM agropacayales_db.dbo.sale_order;`.
2. **Amazon DocumentDB (NoSQL):**
   * Muestra la consola de **Amazon DocumentDB** con el clúster activo en puerto `27017`.
   * En Swagger de Backend 1 ejecuta `GET /api/insumos` o `GET /api/parcelas` para demostrar la lectura en tiempo real desde la BD documental.

### 2. Evidencia de los 2 Backends en AWS EC2 (Criterio 2)
1. Muestra la terminal SSH de `k8s-master` ejecutando:
   ```bash
   kubectl get pods -n agropacayales-namespace -o wide
   ```
   *Señala que `backend1` corre en el nodo `role=backend1` y `backend2` en el nodo `role=backend2`.*
2. Abre en vivo los dos Swagger interactivos:
   * **Backend 1:** `http://<IP_EC2>:30001/swagger-ui.html`
   * **Backend 2:** `http://<IP_EC2>:30002/docs`

### 3. Evidencia del Frontend Web en Amazon S3 (Criterio 3)
1. Muestra la consola de **Amazon S3** con el bucket `agropacayales-frontend-t05` y la propiedad *Static website hosting* activa.
2. Abre la URL pública del bucket:
   `http://agropacayales-frontend-t05.s3-website-us-east-1.amazonaws.com`
3. Inicia sesión con: `ana.felix@agropacayales.com` / `Pass123!`
4. Navega a **Dashboard** (gráficos analíticos de Backend 2) y a **Sectores y Parcelas** (datos transaccionales de Backend 1).
5. Presiona **F5** en cualquier módulo para demostrar que el enrutamiento SPA no genera error 404.

### 4. Demostración de Resiliencia en Kubernetes (Bonus Jurado)
1. **Auto-reparación (Self-Healing):**
   ```bash
   # Elimina el pod del frontend o backend
   kubectl delete pod -l app=backend1 -n agropacayales-namespace
   # Demuestra que Kubernetes levantó un nuevo Pod en segundos
   kubectl get pods -n agropacayales-namespace -w
   ```
2. **Escalado Dinámico:**
   ```bash
   kubectl scale deployment backend1-deployment --replicas=3 -n agropacayales-namespace
   kubectl get pods -n agropacayales-namespace
   ```
