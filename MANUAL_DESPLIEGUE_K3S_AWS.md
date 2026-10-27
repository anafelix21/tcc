# Guía Maestra de Despliegue en AWS K3s: AgroPacayales S.A.C.

**Proyecto:** AgroPacayales S.A.C.  
**Usuario Docker Hub:** `hugo454`  
**Tag Oficial de Imágenes:** `:2.0`  
**Namespace Kubernetes:** `agropacayales-namespace`  
**Stack de Cómputo:** K3s v1.31+ sobre Amazon EC2 (1 Control Plane + 3 Workers dedicados)  
**Persistencia Políglota:** Amazon RDS (Microsoft SQL Server 2022 Express) + EC2 Dedicada (MongoDB 8.0)  
**Cliente Móvil:** Expo React Native (Local) conectado a NodePorts públicos de AWS  

---

## 1. Distribución del Equipo y Módulos Maestros

El Frontend ha sido completamente migrado a **React 19 + TypeScript + Vite** utilizando **Feature-Based Architecture**, eliminando cualquier rastro de Angular. La distribución de maestros por integrante es:

| Integrante | Código | Módulo Maestro Asignado | Ruta Web | Backend 1 (Spring) | Colección Mongo | Tabla SQL Server |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hugo Fernández** | `#07` | **Insumos Agrícolas** | `/insumos` | `/api/insumos` | `supplies` (200 registros) | `movimiento_insumo` |
| **Ana Félix** | `#05` | **Parcelas de Cultivo** | `/parcelas` | `/api/parcelas` | `plots` (160 registros) | `cultivos` |
| **Axel Huapaya** | `#10` | **Usuarios y Personal** | `/usuarios` | `/api/usuarios` | `users` (150 registros) | `asignacion_cabecera` |

### Funcionalidades Implementadas en el Frontend:
- **Botón "Ojito" (Inspección Técnica):** Presente en todas las tablas (`/insumos`, `/parcelas`, `/usuarios`, `/actividades`, `/cultivos`, `/cosechas`, `/fichas-campo`, `/asignaciones`). Abre un modal con especificaciones técnicas detalladas y subtablas relacionadas (ej: insumos consumidos en labores de campo, operarios en asignaciones).
- **Centro de Inteligencia Analítica (`/dashboard`):** Frontend del Backend 2 (Flask + Pandas) cubriendo los 18 indicadores PIT divididos en 4 pestañas interactivas (*Resumen Ejecutivo*, *Hugo Fernández #07*, *Ana Félix #05*, *Axel Huapaya #10*).
- **Paginación Ampliada:** Soporta 10, 25, 50, 100, 200 y 500 registros para listar el 100% de la base de datos sin truncar.
- **Login Institucional:** Acceso en `/login` con fondo corporativo y chips de acceso rápido.

---

## 2. Arquitectura de Red y Topología en AWS

```
                            USUARIO EXTERNO / DOCENTE
                                       |
    +----------------------------------+----------------------------------+
    |                                  |                                  |
    v                                  v                                  v
http://IP_PUB_FRONT:30000   http://IP_PUB_BACK1:30001   http://IP_PUB_BACK2:30002
 (Frontend React + Nginx)   (Swagger Spring Boot)       (OpenAPI Docs Flask)
                                                                ^
                                                                |
                                             App Móvil (Local Expo SDK 54)

+---------------------------------------------------------------------------------+
|                       VPC DEFAULT AWS (172.31.0.0/16)                           |
|                                                                                 |
|  [k8s-master] -----------------+                                                |
|  Control Plane K3s (t3.small)  |                                                |
|  (Sin cargas de aplicación)    |                                                |
|                                |                                                |
|  [k8s-node-frontend] <---------+ DNS interno:                                  |
|  role=frontend (t3.small)      | proxy_pass http://backend-transaccional:8081   |
|  Nginx + React SPA (:80)       | proxy_pass http://backend-analitico:5000       |
|                                |                                                |
|  [k8s-node-backend] <----------+ Eventos HTTP:                                  |
|  role=backend1 (t3.medium)     | POST http://backend-analitico:5000/api/v1/...  |
|  Spring WebFlux (:8081)        |                                                |
|                                |                                                |
|  [k8s-node-backendAnalitico] <-+                                                |
|  role=backend2 (t3.small)      |                                                |
|  Python Flask Gunicorn (:5000) |                                                |
|                                |                                                |
|               +----------------+----------------+                               |
|               |                                 |                               |
|               v (Puerto 1433)                   v (Puerto 27017)                |
|      [Amazon RDS SQL Server]            [ec2-mongodb]                           |
|      db.t3.micro (Express)              EC2 t3.small (Ubuntu 24.04)             |
|      Base: agropacayales_db             Base: agropacayales_db                  |
+---------------------------------------------------------------------------------+
```

---

## 3. Matriz de Parámetros y Credenciales

| Componente | Parámetro | Valor de Configuración | Dónde se utiliza |
| :--- | :--- | :--- | :--- |
| **Docker Hub** | Usuario / Tag | `hugo454` / `:2.0` | Deployments Kubernetes |
| **RDS SQL Server** | Motor / Clase | SQL Server Express / `db.t3.micro` | Consola RDS |
| **RDS SQL Server** | Base de Datos | `agropacayales_db` | ConfigMap / SSMS |
| **RDS SQL Server** | Usuario / Clave | `admin` / `AgroPacayales2026!` | Secret K8s / SSMS |
| **MongoDB** | Puerto / Base | `27017` / `agropacayales_db` | Secret K8s / URI conexión |
| **MongoDB** | Usuario / Clave | `admin` / `Mongo12345` | Secret K8s / mongosh |
| **K3s Cluster** | Token de Cluster | `agropacayales-token-2026` | Join de Workers a Master |
| **NodePorts** | Front / Back1 / Back2 | `30000` / `30001` / `30002` | Services K8s y Browser |

---

## 4. Paso a Paso Detallado de Implementación

### Paso 1: Crear Amazon RDS SQL Server (Hacer Primero)
> [!IMPORTANT]
> La creación de una base de datos RDS toma ~12 minutos en AWS. Iníciala primero para que se aprovisione mientras realizas el resto de pasos.

1. Abre la consola de **AWS** en español (Región: `us-east-1`).
2. En el buscador escribe **RDS** → entra a **Bases de datos** → botón naranja **Crear base de datos**.
3. **Método de creación:** **Creación estándar**.
4. **Opciones del motor:**
   - Tipo de motor: **Microsoft SQL Server**.
   - Edición: **SQL Server Express Edition**.
5. **Configuración:**
   - Identificador: `agropacayales-rds-sqlserver`.
6. **Configuración de credenciales:**
   - Usuario maestro: `admin`.
   - Contraseña maestra: `AgroPacayales2026!` (confirmar la misma contraseña abajo).
7. **Configuración de instancias:**
   - Selecciona **Clases ampliables** → `db.t3.micro` (1 vCPU, 1 GiB RAM).
8. **Almacenamiento:**
   - Tipo: `gp3`, `20` GiB.
   - **Desactiva la casilla:** *Habilitar el escalado automático de almacenamiento*.
9. **Conectividad:**
   - Nube virtual privada: *VPC predeterminada*.
   - Acceso público: **No**.
   - Grupo de seguridad: Selecciona **Crear nuevo** y escribe: `evi-rds-sg`.
10. **Configuración adicional:**
    - Desactiva copias de seguridad automáticas y clic en **Crear base de datos**.
11. Cuando esté **Disponible**, copia el **Punto de enlace** (*Endpoint*).

---

### Paso 2: Configurar Grupos de Seguridad (Security Groups)

En el buscador de AWS escribe **EC2** → menú izquierdo **Grupos de seguridad** → **Crear grupo de seguridad**:

#### 2.1. Grupo de seguridad `evi-ec2-sg` (Para las 5 máquinas EC2)
- **Nombre:** `evi-ec2-sg` | **Descripción:** `Trafico k3s, ssh, nodeports y mongodb` | **VPC:** predeterminada
- En **Reglas de entrada**, agrega:

| Tipo | Protocolo | Rango de puertos | Origen | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `0.0.0.0/0` (Cualquier lugar) | Acceso remoto y túneles SSH |
| **TCP personalizado** | TCP | `30000 - 30002` | `0.0.0.0/0` (Cualquier lugar) | NodePorts de Frontend, Swagger y Flask |
| **TCP personalizado** | TCP | `6443` | `evi-ec2-sg` (el mismo grupo) | Comunicación interna API K3s |
| **TCP personalizado** | TCP | `10250` | `evi-ec2-sg` (el mismo grupo) | Kubelet métricas entre nodos |
| **UDP personalizado** | UDP | `8472` | `evi-ec2-sg` (el mismo grupo) | Red Flannel VXLAN entre pods |
| **TCP personalizado** | TCP | `27017` | `evi-ec2-sg` (el mismo grupo) | Acceso a MongoDB dentro de la VPC |

Clic en **Crear grupo de seguridad**.

#### 2.2. Grupo de seguridad `evi-rds-sg` (Asignado a RDS)
Entra a editar sus reglas de entrada:
- **Tipo:** `MSSQL` | **Puerto:** `1433` | **Origen:** Selecciona `evi-ec2-sg`.
Clic en **Guardar reglas**.

---

### Paso 3: Imágenes Docker Publicadas
Las 3 imágenes ya se encuentran publicadas en Docker Hub bajo el tag oficial `:2.0`:
- **Frontend React 19:** `hugo454/agropacayales-frontend:2.0`
- **Backend 1 Spring Boot:** `hugo454/agropacayales-backend:2.0`
- **Backend 2 Flask:** `hugo454/agropacayales-backend-analitico:2.0`

---

### Paso 4: Lanzar las 5 Instancias EC2 con Datos de Usuario (User Data)

En EC2 → **Lanzar instancias**:
- **AMI:** Ubuntu Server 24.04 LTS (x86_64).
- **Par de claves:** Tu llave `.pem`.
- **Configuración de red:** VPC predeterminada, Asignar automáticamente IP pública: **Habilitar**, Grupo: `evi-ec2-sg`.

#### 4.1. Instancia `ec2-mongodb` (t3.small)
En **Detalles avanzados** → **Datos del usuario** pega:

```bash
#!/bin/bash
set -e
# 1. Instalar paquetes de MongoDB 8.0
apt-get update && apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt-get update && apt-get install -y mongodb-org

# 2. Parche rseq para Ubuntu 24.04
mkdir -p /etc/systemd/system/mongod.service.d
printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' > /etc/systemd/system/mongod.service.d/rseq.conf
systemctl daemon-reload

# 3. Exponer bindIp e iniciar servicio
sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
systemctl enable --now mongod
sleep 6

# 4. Crear usuario administrador con privilegios root
mongosh --eval 'db.getSiblingDB("admin").createUser({user:"admin",pwd:"Mongo12345",roles:["root"]})'
printf "\nsecurity:\n  authorization: enabled\n" >> /etc/mongod.conf
systemctl restart mongod
apt-mark hold linux-aws linux-image-aws linux-headers-aws
```

#### 4.2. Instancia `k8s-master` (t3.small)
En **Detalles avanzados** → **Datos del usuario** pega:

```bash
#!/bin/bash
set -e
curl -sfL https://get.k3s.io | K3S_TOKEN="agropacayales-token-2026" sh -s - server --write-kubeconfig-mode 644
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
echo 'export KUBECONFIG=/home/ubuntu/.kube/config' >> /home/ubuntu/.bashrc
apt-get update && apt-get install -y netcat-openbsd curl jq
```

#### 4.3. Las 3 Instancias Workers (Sin datos de usuario)
Lanza las 3 restantes dejando el campo de datos de usuario vacío:
1. `k8s-node-frontend` (t3.small)
2. `k8s-node-backend` (t3.medium - 4 GB RAM)
3. `k8s-node-backendAnalitico` (t3.small)

---

### Paso 5: Unir Workers a K3s y Etiquetar Nodos

1. Conéctate por SSH a cada uno de los 3 workers y ejecuta:
```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 K3S_TOKEN="agropacayales-token-2026" sh -
```

2. Conéctate por SSH a `k8s-master`:
```bash
ssh -i tu-llave.pem ubuntu@<IP_PUBLICA_MASTER>
```

3. Verifica los nombres de nodos y asigna las etiquetas:
```bash
kubectl get nodes

kubectl label node <NOMBRE_NODO_FRONTEND> role=frontend
kubectl label node <NOMBRE_NODO_BACKEND> role=backend1
kubectl label node <NOMBRE_NODO_BACKEND_ANALITICO> role=backend2

kubectl get nodes -L role
```

---

### Paso 6: Inicialización de Bases de Datos (Método para la PC del Instituto)

> [!TIP]
> En la PC del instituto no tienes acceso a rutas de tu disco local ni `mongosh` instalado en Windows. Sigue estos pasos garantizados:

#### 6.1. Cargar SQL Server (RDS):
1. En tu terminal local de Windows abre el túnel SSH hacia Master usando tu clave `k8s-master.pem`:
```powershell
ssh -i k8s-master.pem -N -L 1433:<ENDPOINT_RDS>:1433 -L 27017:<IP_PRIVADA_MONGO>:27017 ubuntu@<IP_PUBLICA_MASTER>

# Ejemplo directo listo para copiar y pegar:
ssh -i k8s-master.pem -N -L 1433:agropacayales-rds-sqlserver.c4rhnptakjkc.us-east-1.rds.amazonaws.com:1433 -L 27017:172.31.26.155:27017 ubuntu@13.218.110.179
```
2. Abre SSMS o Azure Data Studio, conéctate a `localhost,1433` (user: `admin` / pass: `AgroPacayales2026!`).
3. Abre una nueva consulta, copia el contenido de `init_sqlserver_completo.sql` y ejecútalo (+800 registros creados).

#### 6.2. Cargar MongoDB (Directo en la máquina EC2):
1. Conéctate por SSH directo a la máquina de MongoDB con tu clave `k8s-master.pem`:
```powershell
ssh -i k8s-master.pem ubuntu@<IP_PUBLICA_EC2_MONGODB>
```
2. Crea el archivo pegando el script con cat:
```bash
cat << 'EOF' > init_mongodb.js
// Pega aquí el contenido de scripts/init_mongodb_completo.js
EOF
```
3. Ejecútalo dentro de Linux:
```bash
mongosh "mongodb://admin:Mongo12345@localhost:27017/?authSource=admin" init_mongodb.js
```
Debe confirmar: *Insertados 200 insumos, 160 parcelas y 150 usuarios*.

---

### Paso 7: Manifiestos de Kubernetes y Despliegue

En la terminal SSH de `k8s-master`, crea el manifiesto unificado:
```bash
nano agropacayales.yml
```
Pega el siguiente contenido (reemplazando `ENDPOINT_DE_RDS` y `IP_PRIVADA_MONGO`):

```yaml
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
  SQL_HOST: "ENDPOINT_DE_RDS"
  SQL_PORT: "1433"
  SQL_DATABASE: "agropacayales_db"
  SQL_USERNAME: "admin"
  ANALYTICS_URL: "http://backend-analitico.agropacayales-namespace.svc.cluster.local:5000"
  ANALYTICS_EVENTS_ENABLED: "true"
  FLASK_PORT: "5000"
  MONGO_DB_NAME: "agropacayales_db"
  SQL_SERVER: "ENDPOINT_DE_RDS"
  SQL_USER: "admin"
---
apiVersion: v1
kind: Secret
metadata:
  name: agropacayales-secret
  namespace: agropacayales-namespace
type: Opaque
stringData:
  MONGO_URI: "mongodb://admin:Mongo12345@IP_PRIVADA_MONGO:27017/agropacayales_db?authSource=admin"
  SQL_PASSWORD: "AgroPacayales2026!"
---
# BACKEND 1 TRANSACCIONAL (SPRING BOOT)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-transaccional
  namespace: agropacayales-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend-transaccional
  template:
    metadata:
      labels:
        app: backend-transaccional
    spec:
      nodeSelector:
        role: backend1
      containers:
      - name: backend-transaccional
        image: hugo454/agropacayales-backend:2.0
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
  name: backend-transaccional
  namespace: agropacayales-namespace
spec:
  type: NodePort
  selector:
    app: backend-transaccional
  ports:
  - port: 8081
    targetPort: 8081
    nodePort: 30001
---
# BACKEND 2 ANALITICO (PYTHON FLASK)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-analitico
  namespace: agropacayales-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend-analitico
  template:
    metadata:
      labels:
        app: backend-analitico
    spec:
      nodeSelector:
        role: backend2
      containers:
      - name: backend-analitico
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
  name: backend-analitico
  namespace: agropacayales-namespace
spec:
  type: NodePort
  selector:
    app: backend-analitico
  ports:
  - port: 5000
    targetPort: 5000
    nodePort: 30002
---
# FRONTEND (REACT 19 + VITE + NGINX)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
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
```

Aplica el manifiesto y monitorea los pods:
```bash
kubectl apply -f agropacayales.yml
kubectl get pods -n agropacayales-namespace -o wide -w
```

---

## 5. Correcciones Clave Aplicadas Durante el Sprint

1. **Swagger UI Backend 2 ("Failed to fetch"):** Se eliminó `"host": "127.0.0.1:5000"` de `swagger.json` para que tome automáticamente la IP de la petición externa (`window.location.host`), permitiendo ejecutar peticiones desde el navegador sin errores.
2. **Nginx DNS Resolver y Tiempos de Espera:** Se depuró `nginx.conf` eliminando el resolver innecesario `127.0.0.11:53` (propio de Docker Compose que arrojaba `111: Connection refused` en Kubernetes). Se fijó el resolver interno de K3s (`10.43.0.10`) con timeouts de proxy explícitos (`proxy_connect_timeout 5s; proxy_read_timeout 15s;`) y FQDN completo (`backend-transaccional.agropacayales-namespace.svc.cluster.local:8081`).
3. **Resolución de Bloqueo de Red Inter-Nodos (Flannel VXLAN UDP 8472):** Al distribuir los pods en diferentes instancias EC2 (`role=frontend` en Worker 3 y `role=backend1` en Worker 1), las peticiones sufrían timeouts (`signal is aborted without reason`) porque el Security Group de AWS descartaba el tráfico UDP 8472 entre instancias. Se implementaron dos soluciones:
   - **Solución en AWS:** Agregar regla en el Security Group: *Todo el tráfico (0-65535)* con origen `172.31.0.0/16` (VPC interna).
   - **Solución K8s Inmediata:** Co-localizar el frontend en el nodo del backend (`nodeSelector: role: backend1`), logrando que el tráfico viaje por el puente local del kernel (`cni0`) con latencia < 0.2ms.
4. **Purga Total de Datos Mock y Sincronización Bidireccional:** Se eliminaron todos los arreglos estáticos locales (`MOCK_PARCELAS`, `MOCK_INSUMOS`, etc.) en los servicios del frontend (`parcelaService`, `insumoService`, `usuarioService`, etc.), garantizando que el 100% de operaciones se lean y escriban directamente en MongoDB y SQL Server.
5. **Exportación Universal a Excel y PDF:** Se diseñó el módulo `exportUtils.ts` que permite exportar reportes tabulares estructurados con formato empresarial tanto en formato CSV con BOM UTF-8 (compatible con Microsoft Excel sin distorsión de tildes) como impresión directa PDF vectorizada.

---

## 6. Cliente Móvil: AgroPacayales Mobile (React Native + Expo SDK 58)

La aplicación móvil (`ASE251S4_T05-mobile`) fue diseñada específicamente para los operarios, agrónomos y supervisores en campo. Cubre el **Flujo Diario del Operario**, registro fitosanitario de **Fichas de Campo** en tiempo real, consulta de catálogos maestros y el dashboard analítico directamente desde un smartphone o emulador.

---

### 6.1. ¿Dónde está el archivo de configuración y qué contiene?

El archivo de configuración de variables de entorno se encuentra en:
📁 **Ruta exacta en tu disco:**
`e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile\.env`

> [!IMPORTANT]
> **¿Por qué existe este archivo?**  
> React Native y Expo utilizan el prefijo `EXPO_PUBLIC_` para inyectar variables de red directamente en el código de la aplicación al momento de compilar. De este modo, la app sabe a qué servidor enviar las peticiones HTTP (`fetch`) sin quemar IPs estáticas en el código TypeScript.

---

### 6.2. ¿Qué poner exactamente en el archivo `.env`? (Escenarios Explicados)

Abre el archivo `e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile\.env` con cualquier editor de texto o en el IDE, y coloca **exactamente** lo siguiente según tu objetivo de prueba:

#### Escenario A (RECOMENDADO / SUSTENTACIÓN): Conectado al Clúster Kubernetes en AWS
Utiliza este escenario cuando tu clúster K3s en Amazon EC2 esté encendido. La app se conectará por internet a los NodePorts públicos de AWS:

```env
EXPO_PUBLIC_API_URL=http://13.218.34.30:30001/api
EXPO_PUBLIC_ANALYTICS_URL=http://13.218.34.30:30002/api/v1/analytics
```

**Desglose línea por línea:**
- `EXPO_PUBLIC_API_URL=http://13.218.34.30:30001/api`
  - `13.218.34.30`: Es la IP pública de tu instancia EC2 (`k8s-node-backend` o `k8s-master`) en AWS.
  - `:30001`: Es el **NodePort** público expuesto por el servicio Kubernetes `backend-transaccional-service` que redirige el tráfico al pod de Spring Boot WebFlux (puerto interno 8081).
  - `/api`: Es el prefijo base de todos los endpoints REST transaccionales (`/api/insumos`, `/api/parcelas`, `/api/actividades-cultivos`, `/api/fichas-campo`, etc.).
- `EXPO_PUBLIC_ANALYTICS_URL=http://13.218.34.30:30002/api/v1/analytics`
  - `:30002`: Es el **NodePort** público expuesto por `backend-analitico-service` que redirige al pod de Python Flask + Pandas (puerto interno 5000).
  - `/api/v1/analytics`: Es la ruta raíz de los 18 indicadores analíticos agronómicos.

---

#### Escenario B: Conectado a Backends Locales (Ejecutándose en tu PC Windows)
Si estás corriendo Spring Boot (`localhost:8081`) y Flask (`localhost:5000`) directamente en tu computadora:

- **Si vas a probar en el Navegador Web de tu PC (`w` en Expo):**
  ```env
  EXPO_PUBLIC_API_URL=http://localhost:8081/api
  EXPO_PUBLIC_ANALYTICS_URL=http://localhost:5000/api/v1/analytics
  ```
- **Si vas a probar en tu Celular Físico (Expo Go vía Wi-Fi):**
  > [!CAUTION]
  > **¡REGLA DE ORO DE CELULARES FÍSICOS!**  
  > En un teléfono físico **NUNCA uses `localhost` ni `127.0.0.1`**, porque el teléfono intentará conectarse a sí mismo y dará error de conexión.  
  > Debes poner la IP de tu PC en tu red Wi-Fi local (la obtienes ejecutando `ipconfig` en PowerShell, ej. `192.168.1.45`):
  ```env
  EXPO_PUBLIC_API_URL=http://192.168.1.45:8081/api
  EXPO_PUBLIC_ANALYTICS_URL=http://192.168.1.45:5000/api/v1/analytics
  ```

---

### 6.3. ¡CRÍTICO! La Regla de la Memoria Caché de Expo

> [!WARNING]
> Expo empaqueta las variables de entorno en memoria caché durante el arranque. Si modificas el archivo `.env` mientras la terminal de Expo ya está corriendo, **Expo NO detectará los cambios automáticamente**.
>
> **Procedimiento obligatorio cada vez que cambies el `.env`:**
> 1. Ve a la terminal donde corre Expo y presiona `Ctrl + C` para detener el proceso.
> 2. Vuelve a iniciarlo limpiando la caché con el parámetro `-c`:
>    ```powershell
>    npx expo start -c
>    ```

---

### 6.4. Paso a Paso: Cómo Ejecutar y Probar la Aplicación Móvil

#### Paso 1: Abrir la terminal en la carpeta móvil
En PowerShell de Windows:
```powershell
cd "e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile"
```

#### Paso 2: Iniciar el servidor de desarrollo Expo
```powershell
npx expo start -c
```
Verás aparecer en la consola un menú interactivo y un gran código QR:
```
  › Metro waiting on exp://192.168.1.45:8081
  › Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

  › Using Expo Go
  › Press a │ open Android
  › Press w │ open web
  › Press r │ reload app
  › Press m │ toggle menu
```

---

#### Paso 3: Elegir el Modo de Visualización

##### MODO 1: En tu PC / Laptop (Simulador de Smartphone de Alta Gama) 🌟 *Recomendado para la Sustentación*
1. Con la terminal de Expo activa, presiona simplemente la tecla **`w`** en tu teclado.
2. Expo compilará la versión web y la abrirá automáticamente en Google Chrome o tu navegador predeterminado (en `http://localhost:8081`).
3. **¿Qué verás?**
   - En pantallas de escritorio, la aplicación se renderiza dentro de un **marco centrado de smartphone de lujo** (`max-width: 520px`).
   - Los laterales de la pantalla tienen el fondo corporativo **Deep Earth Brown (`#1A110B`)**.
   - El marco incluye bisel superior con bocina/cámara frontal y barra de inicio inferior.
   - Permite interacción completa con clic de mouse simulando toques táctiles.

##### MODO 2: En tu Teléfono Físico (Android o iPhone)
1. Descarga e instala la aplicación gratuita **Expo Go** desde:
   - **Android:** Google Play Store
   - **iOS:** Apple App Store
2. Abre la app Expo Go en tu teléfono:
   - En Android: Toca **"Scan QR Code"** y apunta la cámara a la terminal de tu PC.
   - En iPhone: Abre la cámara nativa de iOS, enfoca el código QR y toca el enlace de Expo.
3. La aplicación se descargará en 5 segundos y se abrirá en tu teléfono ocupando el **100% de la pantalla nativa táctil fluida**.
4. Como el archivo `.env` apunta a la IP pública de AWS (`13.218.34.30:30001`), ¡funciona tanto con Wi-Fi como con datos móviles 4G/5G desde cualquier parte!

##### MODO 3: En Emulador Android (Android Studio)
Si tienes instalado Android Studio con un dispositivo virtual (AVD):
1. Inicia tu emulador en Android Studio.
2. Presiona la tecla **`a`** en la terminal de Expo.
3. Expo instalará y abrirá automáticamente la aplicación dentro del emulador.

---

### 6.5. Guía de Uso del "Flujo Diario del Operario" y "Nueva Ficha de Campo"

Una vez dentro de la app móvil:

#### 1. Iniciar Sesión con Roles Preconfigurados
- En la pantalla de bienvenida puedes ingresar credenciales o usar el modo invitado/operario.
- Los usuarios vienen sincronizados desde MongoDB (`users`):
  - **Operario de Campo:** `operario@agropacayales.com` (Contraseña: `operario123` o acceso directo).
  - **Agrónomo:** `agronomo@agropacayales.com` (Control fitosanitario completo).
  - **Supervisor / Admin:** `admin@agropacayales.com` (Acceso total a catálogos y transacciones).

#### 2. Acceso Directo: "+ Nueva Ficha de Campo"
- Justo debajo del saludo en la pantalla de inicio, encontrarás un botón esmeralda de alto impacto:
  **`[+ Nueva Ficha de Campo]`**
- Al tocarlo, se abre inmediatamente el formulario técnico fitosanitario (`/fichas-campo/formulario`).
- **Validaciones íntegras respetadas:** Fecha de registro, selección obligatoria de parcela/lote, etapa fenológica (`CRECIMIENTO`, `FLORACION`, `COSECHA`), estado fitosanitario (`OPTIMO`, `ALERTA`, `CRITICO`), condiciones climáticas y diagnóstico de campo.
- Al pulsar **"Guardar Ficha Técnica"**, se almacena directamente en la colección `field_records` de MongoDB en AWS.

#### 3. Flujo Diario del Operario en 1 Clic
En la sección **"Flujo Diario del Operario"** o en **"Mis Labores Asignadas"** (`/mis-labores`):
- Cada tarea de campo (Riego, Fertilización, Poda, Fumigación) cuenta con un control táctil de 3 estados:
  $$\mathbf{[Pendiente]} \;\longrightarrow\; \mathbf{[En\; Proceso]} \;\longrightarrow\; \mathbf{[Completado]}$$
- **Toque en `[En Proceso]`:** La tarea cambia a estado activo con indicador visual en amarillo ámbar y badge de "En Ejecución", permitiendo al operario saber qué labor está ejecutando en ese momento.
- **Toque en `[Completado]`:**
  - El sistema muestra un diálogo de confirmación: *¿Confirma que culminó la labor? Se descontarán automáticamente los insumos utilizados.*
  - Al presionar **Confirmar**, se ejecuta la llamada a `PATCH /api/actividades-cultivos/{id}/finalizar`.
  - **Efecto en tiempo real:**
    1. La labor cambia a verde esmeralda con el sello **"Completado"**.
    2. En SQL Server se actualiza el estado de la labor.
    3. En MongoDB se rebajan automáticamente las cantidades de stock del inventario de insumos utilizados en esa actividad.

---

### 6.6. Diagnóstico y Solución de Errores Comunes en Móvil

| Síntoma / Error | Causa Probable | Solución Inmediata |
| :--- | :--- | :--- |
| **"No se pudo conectar con el servidor (http://13.218.34.30:30001). Revise la URL y su red."** | El Security Group de AWS no tiene abiertos los puertos de NodePort, o la instancia EC2 está apagada. | En la consola de AWS EC2 -> Security Groups -> Reglas de entrada: Asegúrate de tener una regla **Custom TCP** para el rango `30000 - 30002` con origen `0.0.0.0/0`. |
| **Modifiqué el `.env` pero sigue llamando a la IP vieja.** | La caché de empaquetado de Expo sigue guardando los valores antiguos. | Cierra la terminal con `Ctrl + C` y ejecuta `npx expo start -c`. |
| **En Expo Go en mi celular se queda en pantalla blanca o da "Network request failed".** | Pusiste `localhost` en el `.env` en lugar de la IP pública de AWS o la IP LAN de tu PC. | Cambia `localhost` por `http://13.218.34.30:30001/api` en el `.env`, guarda, y reinicia con `npx expo start -c`. |
| **"Cannot find module" o error al iniciar Expo.** | Dependencias no instaladas tras clonar el repositorio. | Ejecuta en la carpeta móvil: `npm install --legacy-peer-deps`. |


---

## 7. URLs y Demostración para la Sustentación

| Servicio | URL de Acceso | Puntos a Sustentar |
| :--- | :--- | :--- |
| **Frontend Web** | `http://<IP_FRONTEND>:30000` | Interfaz React 19 limpia sin nombres de estudiantes, formularios estilizados, botón "Ojito", exportación Excel/PDF y Centro de Inteligencia Analítica. |
| **App Móvil** | Expo Go (QR) / `http://localhost:8081` | App React Native móvil con navegación por Expo Router, catálogos maestros y registro de cosechas/labores conectado a AWS. |
| **Backend 1 Swagger** | `http://<IP_BACKEND1>:30001/webjars/swagger-ui/index.html` | Endpoints reactivos Spring Boot WebFlux de Insumos, Parcelas, Usuarios y Labores. |
| **Backend 2 OpenAPI** | `http://<IP_ANALITICO>:30002/api/v1/analytics/docs/` | 18 indicadores analíticos de rendimiento agronómico. |

### Prueba de Auto-Recuperación de Kubernetes (Self-Healing):
```bash
kubectl delete pod -l app=frontend -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace -w
# Demostrará cómo Kubernetes recrea el pod en 3 segundos automáticamente.
```

