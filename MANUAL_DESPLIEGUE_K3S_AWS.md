# Manual Práctico de Despliegue en AWS K3s — AgroPacayales S.A.C.

**Proyecto:** AgroPacayales S.A.C.  
**Objetivo:** Guía práctica y directa para desplegar la infraestructura completa en AWS en 20 minutos usando **User Data** (automatizado) y **Kubernetes K3s**, incluyendo las pruebas y demostraciones para la sustentación.  
**Tag Oficial Docker Hub:** `hugo454/agropacayales-*:2.0`  
**Namespace Kubernetes:** `agropacayales-namespace`  

---

## 📌 Resumen Rápido de Arquitectura y Puertos

```
                                    CLIENTES
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
   http://<IP_AWS>:30000      http://<IP_AWS>:30001      http://<IP_AWS>:30002
    (Frontend Web React)      (Swagger Spring Boot)      (OpenAPI Flask Analítico)
                                       ▲
                                       │ (Vía NodePort 30001)
                             App Móvil (Expo React Native)
```

| Componente | Tipo de Servidor | Puerto Externo (NodePort) | Rol / Etiqueta |
| :--- | :--- | :--- | :--- |
| **`k8s-master`** | EC2 `t3.small` (Ubuntu 24.04) | — (API interna `6443`) | Control Plane Master |
| **`k8s-node-frontend`** | EC2 `t3.small` (Ubuntu 24.04) | **`30000`** | `role=frontend` |
| **`k8s-node-backend`** | EC2 `t3.medium` (Ubuntu 24.04) | **`30001`** | `role=backend1` |
| **`k8s-node-backendAnalitico`** | EC2 `t3.small` (Ubuntu 24.04) | **`30002`** | `role=backend2` |
| **`ec2-mongodb`** | EC2 `t3.small` (Ubuntu 24.04) | **`27017`** (Mongo) | Base NoSQL Documental |
| **`RDS SQL Server`** | RDS `db.t3.micro` (Express) | **`1433`** (SQL) | Base Relacional ACID |

---

## 🔐 Matriz de Credenciales Oficiales

| Servicio | Usuario | Contraseña | Base de Datos |
| :--- | :--- | :--- | :--- |
| **Amazon RDS SQL Server** | `admin` | `AgroPacayales2026!` | `agropacayales_db` |
| **MongoDB EC2** | `admin` | `Mongo12345` | `agropacayales_db` |
| **Token K3s Clúster** | — | `agropacayales-token-2026` | (Para unir workers) |

---

## 🛡️ Reglas de Seguridad (Security Group en AWS)

Crea un Security Group llamado **`agropacayales-sg`** y asígnalo a todas tus instancias EC2 con las siguientes reglas de entrada:

| Tipo | Protocolo | Rango de Puertos | Origen | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **SSH** | TCP | `22` | `0.0.0.0/0` | Conexión terminal |
| **Kubernetes API** | TCP | `6443` | `172.31.0.0/16` | Comunicación Master ➔ Workers |
| **Custom TCP (NodePorts)** | TCP | `30000 - 30002` | `0.0.0.0/0` | **Acceso público Web, Back1, Back2** |
| **MongoDB** | TCP | `27017` | `0.0.0.0/0` | Conexión backend y mongosh |
| **MS SQL Server** | TCP | `1433` | `0.0.0.0/0` | Conexión backend y SSMS |
| **Flannel Overlay** | UDP | `8472` | `172.31.0.0/16` | Red interna de pods de K3s |

---

# GUÍA DE DESPLIEGUE PASO A PASO

---

## PASO 1: Crear Amazon RDS SQL Server (Hacer Primero)
*(Toma ~12 minutos en crearse; inícialo primero)*

1. En la consola de AWS (Región: `us-east-1`), ve a **RDS** ➔ **Crear base de datos**.
2. Parámetros:
   - **Creación estándar** ➔ **Microsoft SQL Server** ➔ **SQL Server Express**.
   - **Identificador:** `agropacayales-sqlserver`.
   - **Usuario maestro:** `admin`.
   - **Contraseña:** `AgroPacayales2026!`.
   - **Instancia:** `db.t3.micro` | **Almacenamiento:** 20 GiB gp2 (desactivar auto-escalado).
   - **Acceso público:** **Sí** | **Security Group:** `agropacayales-sg`.
3. Una vez en estado **Disponible**, copia el **Endpoint** (ej: `agropacayales-sqlserver.xxxx.us-east-1.rds.amazonaws.com`).
4. Abre SSMS (SQL Server Management Studio) en tu laptop, conéctate con `admin` y ejecuta:
   ```sql
   CREATE DATABASE agropacayales_db;
   GO
   ```

---

## PASO 2: Servidor MongoDB en EC2 (Automatizado con User Data)

1. En AWS EC2, lanza una instancia:
   - **Nombre:** `ec2-mongodb`
   - **AMI:** Ubuntu Server 24.04 LTS (64-bit x86) | **Tipo:** `t3.small`
   - **Security Group:** `agropacayales-sg` | **Disco:** 15 GiB gp3
2. Ve al final a **Detalles avanzados** ➔ **Datos del usuario (User data)** y pega este script:

```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

apt-get update -y && apt-get install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list

apt-get update -y && apt-get install -y mongodb-org
systemctl start mongod && systemctl enable mongod

until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do sleep 2; done

mongosh admin --eval '
db.createUser({ user: "admin", pwd: "Mongo12345", roles: ["userAdminAnyDatabase", "readWriteAnyDatabase", "dbAdminAnyDatabase"] });
'
mongosh agropacayales_db --eval '
db.createUser({ user: "admin", pwd: "Mongo12345", roles: [{ role: "readWrite", db: "agropacayales_db" }] });
'

cat << 'EOF' > /etc/mongod.conf
storage:
  dbPath: /var/lib/mongodb
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
net:
  port: 27017
  bindIp: 0.0.0.0
security:
  authorization: enabled
EOF

systemctl restart mongod
echo "MongoDB 8.0 listo."
```
3. Lanza la instancia y copia su **IP Privada** (ej: `172.31.30.50`).

---

## PASO 3: Clúster K3s en AWS (Automatizado con User Data)

### 3.1. Lanzar el Nodo Master (`k8s-master`)
- EC2 `t3.small` | Ubuntu 24.04 | SG: `agropacayales-sg`.
- En **Datos del usuario (User data)** pega:

```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_TOKEN="agropacayales-token-2026" sh -s - server \
  --disable traefik \
  --disable servicelb \
  --node-name k8s-master \
  --write-kubeconfig-mode 644

mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube

echo "export KUBECONFIG=/home/ubuntu/.kube/config" >> /home/ubuntu/.bashrc
echo "alias k=kubectl" >> /home/ubuntu/.bashrc
```
- Lanza la instancia y copia su **IP Privada** (ejemplo: `172.31.21.112`).

---

### 3.2. Lanzar los 3 Nodos Workers (en paralelo)
> **Importante:** Reemplaza `<IP_PRIVADA_MASTER>` por la IP privada real de tu Master en los 3 scripts antes de lanzarlos.

#### Worker 1: Frontend (`k8s-node-frontend` — `t3.small`)
User Data:
```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 \
  K3S_TOKEN="agropacayales-token-2026" sh -s - agent \
  --node-name k8s-node-frontend \
  --node-label role=frontend
```

#### Worker 2: Backend 1 WebFlux (`k8s-node-backend` — `t3.medium`)
User Data:
```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 \
  K3S_TOKEN="agropacayales-token-2026" sh -s - agent \
  --node-name k8s-node-backend \
  --node-label role=backend1
```

#### Worker 3: Backend 2 Analítico (`k8s-node-backendAnalitico` — `t3.small`)
User Data:
```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 \
  K3S_TOKEN="agropacayales-token-2026" sh -s - agent \
  --node-name k8s-node-backendAnalitico \
  --node-label role=backend2
```

---

### 3.3. Verificar los Nodos en el Master
Conéctate por SSH al Master y ejecuta:
```bash
kubectl get nodes --show-labels
```
**Resultado esperado (los 4 en `Ready` con sus roles asignados):**
```
NAME                       STATUS   ROLES                  VERSION        LABELS
k8s-master                 Ready    control-plane,master   v1.31...       ...
k8s-node-frontend          Ready    <none>                 v1.31...       role=frontend
k8s-node-backend           Ready    <none>                 v1.31...       role=backend1
k8s-node-backendAnalitico  Ready    <none>                 v1.31...       role=backend2
```

---

## PASO 4: Desplegar las Aplicaciones en Kubernetes

1. En el nodo Master, clona el repositorio o crea el archivo del manifiesto:
   ```bash
   git clone https://github.com/anafelix21/tcc.git
   cd tcc
   ```
2. Edita el archivo `k8s-manifests/agropacayales-k8s-all-in-one.yml`:
   ```bash
   nano k8s-manifests/agropacayales-k8s-all-in-one.yml
   ```
   Ajusta únicamente estos 2 valores en el **ConfigMap** y **Secret**:
   - `SQL_HOST`: Coloca el Endpoint de tu RDS SQL Server.
   - `MONGO_URI`: Coloca la IP privada de tu EC2 MongoDB:
     `mongodb://admin:Mongo12345@<IP_PRIVADA_MONGO>:27017/agropacayales_db?authSource=admin`

3. **Aplica el despliegue con un solo comando:**
   ```bash
   kubectl apply -f k8s-manifests/agropacayales-k8s-all-in-one.yml
   ```

4. **Verifica los pods:**
   ```bash
   kubectl get pods -n agropacayales-namespace -o wide
   ```
   *En 1 minuto los 3 pods (`frontend`, `backend-transaccional`, `backend-analitico`) estarán en estado **`Running`**.*

---

## PASO 5: Conectar la Aplicación Móvil (Expo React Native)

1. En tu laptop, abre el archivo:
   `e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile\.env`
2. Coloca la IP pública de tu instancia AWS:
   ```env
   EXPO_PUBLIC_API_URL=http://<IP_PUBLICA_AWS>:30001/api
   EXPO_PUBLIC_ANALYTICS_URL=http://<IP_PUBLICA_AWS>:30002/api/v1/analytics
   ```
3. En la terminal de la app móvil, reinicia limpiando la caché:
   ```powershell
   npx expo start -c
   ```
4. **Para probar en tu laptop con el marco de smartphone:** Presiona la tecla **`w`** (se abre en `http://localhost:8081`).  
   **Para probar en tu celular físico:** Escanea el código QR con la app gratuita **Expo Go**.

---

## 🌐 URLs de Acceso Rápido

Reemplaza `<IP_PUBLICA_AWS>` por la IP de cualquiera de tus nodos:

- **Frontend Web:** `http://<IP_PUBLICA_AWS>:30000`
- **Swagger UI (Spring Boot Backend 1):** `http://<IP_PUBLICA_AWS>:30001/webjars/swagger-ui/index.html`
- **OpenAPI Docs (Flask Backend 2):** `http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/docs/`

---

# 🎯 DEMOSTRACIONES EN VIVO DE KUBERNETES (PARA LA SUSTENTACIÓN)

Usa esta guía rápida frente al jurado para realizar las pruebas en vivo:

### 1. Auto-Recuperación (Self-Healing)
- **Qué decir:** *"Kubernetes garantiza alta disponibilidad; si un pod se cae, el ReplicaSet lo recrea de inmediato."*
- **Comando:**
  ```bash
  kubectl delete pod -l app=backend-transaccional -n agropacayales-namespace
  kubectl get pods -n agropacayales-namespace -w
  ```
- **Resultado:** En 1 segundo el pod viejo muere y uno nuevo arranca en estado `Running`.

---

### 2. Escalabilidad Horizontal en Caliente (HPA / Replica Scaling)
- **Qué decir:** *"Ante un pico de cosecha o exceso de operarios, escalamos los pods del backend en caliente sin reiniciar nada."*
- **Comando:**
  ```bash
  kubectl scale deployment backend-transaccional --replicas=3 -n agropacayales-namespace
  kubectl get pods -n agropacayales-namespace -o wide
  ```
- **Volver a 1 réplica al terminar:**
  ```bash
  kubectl scale deployment backend-transaccional --replicas=1 -n agropacayales-namespace
  ```

---

### 3. Actualización Continua Sin Caídas (Rolling Update)
- **Qué decir:** *"Podemos actualizar la versión de la aplicación sin desconectar a los usuarios usando RollingUpdate."*
- **Comando:**
  ```bash
  kubectl rollout restart deployment/frontend -n agropacayales-namespace
  kubectl rollout status deployment/frontend -n agropacayales-namespace
  ```

---

### 4. Distribución Multi-Nodo (NodeSelector)
- **Qué decir:** *"Cada contenedor corre en un servidor físico dedicado para aislar fallos y evitar que la analítica sature las transacciones."*
- **Comando:**
  ```bash
  kubectl get pods -n agropacayales-namespace -o wide
  ```
- **Mostrar al jurado:**
  - `frontend` corre en `k8s-node-frontend`
  - `backend-transaccional` corre en `k8s-node-backend`
  - `backend-analitico` corre en `k8s-node-backendAnalitico`

---

### 5. Service Discovery y DNS Interno Privado
- **Qué decir:** *"Los microservicios se comunican internamente por nombre DNS privado sin exponer puertos a internet."*
- **Comando:**
  ```bash
  kubectl exec -it deployment/frontend -n agropacayales-namespace -- wget -qO- http://backend-transaccional:8081/api/parcelas
  ```

---

### 6. Streaming de Logs en Tiempo Real
- **Qué decir:** *"Podemos auditar en vivo las peticiones que llegan desde el celular o la web."*
- **Comando:**
  ```bash
  kubectl logs -f deployment/backend-transaccional -n agropacayales-namespace --tail=30
  ```

---

### 7. Comandos de Emergencia (Cheat Sheet)
```bash
# Ver todo el estado en 1 pantalla:
kubectl get all -n agropacayales-namespace

# Diagnosticar un pod con error:
kubectl describe pod <NOMBRE_POD> -n agropacayales-namespace

# Reiniciar todos los pods del proyecto:
kubectl rollout restart deployment -n agropacayales-namespace
```

---

*Nota: Para ver la colección detallada de Payloads JSON de Swagger y scripts CRUD de MongoDB, consulta el archivo complementario: `GUIA_PRUEBAS_SWAGGER_Y_CRUD_MONGODB.md`.*
