# Manual Maestro y Definitivo de Despliegue, Operación y Sustentación: AgroPacayales S.A.C.

**Proyecto:** AgroPacayales S.A.C. — Plataforma Integral de Gestión y Monitoreo Agrícola (FMS)  
**Arquitectura:** Microservicios y Cómputo Políglota sobre Kubernetes K3s (Amazon Web Services)  
**Persistencia Políglota:** MongoDB 8.0 (NoSQL Documental) + Amazon RDS SQL Server 2022 Express (R2DBC Relacional)  
**Backends:** Spring Boot 3.4 WebFlux (Reactivo Asíncrono - `:30001`) + Python 3.11 Flask & Pandas (Analítica - `:30002`)  
**Frontend Web:** React 19 + TypeScript + Vite + Nginx Reverse Proxy (`:30000`)  
**Cliente Móvil:** Expo React Native SDK 54 (Híbrido iOS/Android/Web con Marco Smartphone)  
**Usuario Docker Hub:** `hugo454` | **Tag Oficial:** `:2.0` | **Namespace K8s:** `agropacayales-namespace`  

---

> [!IMPORTANT]
> **GUÍA OFICIAL PARA LA SUSTENTACIÓN TÉCNICA:**
> Este documento constituye la **única fuente de verdad** del proyecto. Ha sido diseñado para que el equipo pueda desplegar la infraestructura en AWS de manera **100% automatizada mediante User Data** (sin necesidad de configurar cada máquina por SSH), realizar pruebas completas con Swagger y MongoDB, operar la app móvil y ejecutar la **Batería de Demostraciones en Vivo de Kubernetes** ante el jurado evaluador.

---

## Índice General

1. [Fundamentos Arquitectónicos y Distribución del Proyecto](#1-fundamentos-arquitectónicos-y-distribución-del-proyecto)
   - 1.1. [Distribución del Equipo y Módulos Maestros](#11-distribución-del-equipo-y-módulos-maestros)
   - 1.2. [Justificaciones Teóricas de Arquitectura (Preguntas de Jurado)](#12-justificaciones-teóricas-de-arquitectura-preguntas-de-jurado)
   - 1.3. [Topología de Red y Arquitectura de Cómputo en AWS](#13-topología-de-red-y-arquitectura-de-cómputo-en-aws)
   - 1.4. [Matriz Maestra de Parámetros, Puertos y Credenciales](#14-matriz-maestra-de-parámetros-puertos-y-credenciales)
2. [Aprovisionamiento Automatizado en AWS con User Data (Cero SSH Manual)](#2-aprovisionamiento-automatizado-en-aws-con-user-data-cero-ssh-manual)
   - 2.1. [¿Qué es el User Data y por qué automatiza todo el despliegue?](#21-qué-es-el-user-data-y-por-qué-automatiza-todo-el-despliegue)
   - 2.2. [Paso 1: Amazon RDS Microsoft SQL Server 2022](#22-paso-1-amazon-rds-microsoft-sql-server-2022)
   - 2.3. [Paso 2: Matriz de Reglas de Seguridad (Security Groups de AWS)](#23-paso-2-matriz-de-reglas-de-seguridad-security-groups-de-aws)
   - 2.4. [Paso 3: Servidor MongoDB 8.0 (Script User Data Autoinstalable)](#24-paso-3-servidor-mongodb-80-script-user-data-autoinstalable)
   - 2.5. [Paso 4: Servidor K3s Master (Script User Data Autoinstalable)](#25-paso-4-servidor-k3s-master-script-user-data-autoinstalable)
   - 2.6. [Paso 5: Workers K3s con Auto-Etiquetado (Scripts User Data para los 3 Nodos)](#26-paso-5-workers-k3s-con-auto-etiquetado-scripts-user-data-para-los-3-nodos)
   - 2.7. [Método Alternativo: Comandos Manuales por SSH (Si no usas User Data)](#27-método-alternativo-comandos-manuales-por-ssh-si-no-usas-user-data)
3. [Empaquetado de Contenedores Docker Hub (Versión Oficial 2.0)](#3-empaquetado-de-contenedores-docker-hub-versión-oficial-20)
   - 3.1. [Imágenes Oficiales y Nginx Reverse Proxy](#31-imágenes-oficiales-y-nginx-reverse-proxy)
   - 3.2. [Scripts de Automatización Local (.bat)](#32-scripts-de-automatización-local-bat)
4. [Manifiesto Maestro de Kubernetes y Despliegue en K3s](#4-manifiesto-maestro-de-kubernetes-y-despliegue-en-k3s)
   - 4.1. [Manifiesto Completo Todo-en-Uno (`agropacayales-k8s-all-in-one.yml`)](#41-manifiesto-completo-todo-en-uno-agropacayales-k8s-all-in-oneyml)
   - 4.2. [Comandos de Despliegue y Verificación en el Master](#42-comandos-de-despliegue-y-verificación-en-el-master)
5. [Guía Exhaustiva de Pruebas en Swagger UI (Backend 1 - Spring Boot)](#5-guía-exhaustiva-de-pruebas-en-swagger-ui-backend-1---spring-boot)
   - 5.1. [Acceso al Portal Interactivo Swagger UI](#51-acceso-al-portal-interactivo-swagger-ui)
   - 5.2. [Módulo de Parcelas (`/api/parcelas` — MongoDB `plots`)](#52-módulo-de-parcelas-apiparcelas--mongodb-plots)
   - 5.3. [Módulo de Insumos Agrícolas (`/api/insumos` — MongoDB `supplies`)](#53-módulo-de-insumos-agrícolas-apiinsumos--mongodb-supplies)
   - 5.4. [Módulo de Usuarios y Personal (`/api/usuarios` — MongoDB `users`)](#54-módulo-de-usuarios-y-personal-apiusuarios--mongodb-users)
   - 5.5. [Módulo de Fichas de Campo (`/api/fichas-campo` — MongoDB `field_records`)](#55-módulo-de-fichas-de-campo-apifichas-campo--mongodb-field_records)
   - 5.6. [Módulo de Cosechas (`/api/harvest` — SQL Server)](#56-módulo-de-cosechas-apiharvest--sql-server)
   - 5.7. [Módulo de Actividades de Cultivo (`/api/actividades-cultivos` — SQL Server)](#57-módulo-de-actividades-de-cultivo-apiactividades-cultivos--sql-server)
   - 5.8. [Módulo de Asignaciones de Personal (`/api/asignaciones-trabajadores`)](#58-módulo-de-asignaciones-de-personal-apiasignaciones-trabajadores)
6. [Operaciones CRUD Directas en Consola MongoDB (`mongosh`)](#6-operaciones-crud-directas-en-consola-mongodb-mongosh)
   - 6.1. [Conexión y Regla de Oro: ¿Por qué en Mongo es `_id` y en el JSON es `id`?](#61-conexión-y-regla-de-oro-por-qué-en-mongo-es-_id-y-en-el-json-es-id)
   - 6.2. [CRUD Completo: Colección `plots` (Parcelas)](#62-crud-completo-colección-plots-parcelas)
   - 6.3. [CRUD Completo: Colección `supplies` (Insumos)](#63-crud-completo-colección-supplies-insumos)
   - 6.4. [CRUD Completo: Colección `users` (Usuarios)](#64-crud-completo-colección-users-usuarios)
   - 6.5. [CRUD Completo: Colección `field_records` (Fichas de Campo)](#65-crud-completo-colección-field_records-fichas-de-campo)
7. [Validación y Endpoints de Backend 2 (Python Flask Analítico)](#7-validación-y-endpoints-de-backend-2-python-flask-analítico)
8. [Despliegue y Operación de la Aplicación Móvil (Expo React Native)](#8-despliegue-y-operación-de-la-aplicación-móvil-expo-react-native)
   - 8.1. [Configuración de Variables de Entorno (`.env`)](#81-configuración-de-variables-de-entorno-env)
   - 8.2. [Ejecución y Modos de Prueba (Web Frame, Expo Go en Smartphone, Emulador)](#82-ejecución-y-modos-de-prueba-web-frame-expo-go-en-smartphone-emulador)
   - 8.3. [Flujo Diario del Operario en 1 Clic](#83-flujo-diario-del-operario-en-1-clic)
   - 8.4. [Diagnóstico y Solución de Errores Comunes en Móvil](#84-diagnóstico-y-solución-de-errores-comunes-en-móvil)
9. [Batería de Demostraciones en Vivo de Kubernetes para la Sustentación](#9-batería-de-demostraciones-en-vivo-de-kubernetes-para-la-sustentación)
   - 9.1. [DEMO 1: Auto-Recuperación y Resiliencia (Self-Healing en 2 segundos)](#91-demo-1-auto-recuperación-y-resiliencia-self-healing-en-2-segundos)
   - 9.2. [DEMO 2: Escalabilidad Horizontal en Caliente (HPA / Pod Replica Scaling)](#92-demo-2-escalabilidad-horizontal-en-caliente-hpa--pod-replica-scaling)
   - 9.3. [DEMO 3: Despliegue Continuo Sin Caídas (Zero-Downtime Rolling Update)](#93-demo-3-despliegue-continuo-sin-caídas-zero-downtime-rolling-update)
   - 9.4. [DEMO 4: Asignación Física de Cargas (NodeSelector & Aislamiento Multi-Nodo)](#94-demo-4-asignación-física-de-cargas-nodeselector--aislamiento-multi-nodo)
   - 9.5. [DEMO 5: Service Discovery y DNS Interno de Kubernetes (CoreDNS)](#95-demo-5-service-discovery-y-dns-interno-de-kubernetes-coredns)
   - 9.6. [DEMO 6: Seguridad y Desacoplamiento (ConfigMaps & Secrets en Base64)](#96-demo-6-seguridad-y-desacoplamiento-configmaps--secrets-en-base64)
   - 9.7. [DEMO 7: Trazabilidad y Logs en Streaming en Tiempo Real](#97-demo-7-trazabilidad-y-logs-en-streaming-en-tiempo-real)
   - 9.8. [DEMO 8: Simulación de Caída de un Servidor Worker en AWS](#98-demo-8-simulación-de-caída-de-un-servidor-worker-en-aws)
   - 9.9. [DEMO 9: Cheat Sheet de Emergencia y Rescate Rápido](#99-demo-9-cheat-sheet-de-emergencia-y-rescate-rápido)

---

## 1. Fundamentos Arquitectónicos y Distribución del Proyecto

### 1.1. Distribución del Equipo y Módulos Maestros

El Frontend ha sido completamente construido sobre **React 19 + TypeScript + Vite** utilizando **Feature-Based Architecture**, con la paleta de diseño oficial **AgroPacayales Enterprise** (Deep Earth Brown `#1A110B`, Sand Warm `#FDFBF9`, Terracotta `#C28D66` y Vibrant Emerald `#10B981`).

| Integrante | Código | Módulo Maestro Asignado | Ruta Web | Backend 1 (Spring) | Colección Mongo | Tabla SQL Server |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Hugo Fernández** | `#07` | **Insumos Agrícolas** | `/insumos` | `/api/insumos` | `supplies` (200 registros) | `movimiento_insumo` |
| **Ana Félix** | `#05` | **Parcelas de Cultivo** | `/parcelas` | `/api/parcelas` | `plots` (160 registros) | `cultivos` |
| **Axel Huapaya** | `#10` | **Usuarios y Personal** | `/usuarios` | `/api/usuarios` | `users` (150 registros) | `asignacion_cabecera` |

#### Funcionalidades Clave del Sistema:
1. **Inspección Técnica ("Ojito"):** Presente en todas las tablas (`/insumos`, `/parcelas`, `/usuarios`, `/actividades`, `/cultivos`, `/cosechas`, `/fichas-campo`, `/asignaciones`). Despliega modales técnicos con detalle de registros hijos (insumos aplicados, operarios asignados, coordenadas).
2. **Centro de Inteligencia Analítica (`/dashboard`):** Conecta con el Backend 2 (Flask + Pandas) y expone los 18 indicadores analíticos PIT organizados por pestañas ejecutivas.
3. **Monitor Fenológico & Cuaderno Técnico de Campo:** Componente visual interactivo que traduce los días transcurridos desde la siembra real y las evaluaciones de las visitas técnicas del agrónomo en una línea de tiempo biológica viva, sin requerir sensores de hardware.
4. **Paginación Dinámica:** Selector de 10, 25, 50, 100, 200 y 500 registros para auditar el 100% de la base de datos sin truncar información.

---

### 1.2. Justificaciones Teóricas de Arquitectura (Preguntas de Jurado)

#### Pregunta 1: ¿Por qué Persistencia Políglota (MongoDB + SQL Server)?
- **MongoDB 8.0 (NoSQL Documental — `plots`, `supplies`, `users`, `field_records`):**
  - **Flexibilidad Edafológica:** Cada lote agrícola presenta variables dispares (análisis de textura, pH, materia orgánica) y sistemas de riego heterogéneos (caudales en L/h, emisores por pulso, válvulas de sector). En tablas relacionales exigiría decenas de tablas intermedias con `JOINs` innecesarios.
  - **Subdocumentos Embebidos y Lectura Atómica:** Al consultar una parcela o una ficha de campo, el cliente web o móvil obtiene en **un solo viaje de red (Single Round-Trip)** la información agronómica, las condiciones de suelo y el sistema de riego sin saturar el canal de comunicación.
- **Amazon RDS SQL Server 2022 (Relacional ACID — `harvests`, `activities`, `crops`, `plot_assignments`):**
  - **Integridad Transaccional y Financiera:** Las cosechas implican pesajes, mermas y balances contables. Las labores de campo conllevan deducción de inventario y costos devengados. Un motor relacional garantiza consistencia estricta (**ACID**) para que ninguna cosecha o labor quede huérfana o con balances contables descuadrados.

#### Pregunta 2: ¿Por qué Spring Boot WebFlux Reactivo Asíncrono?
- **Arquitectura Basada en Event Loop (Netty):** A diferencia de Spring MVC tradicional que utiliza un hilo por petición (*Thread-per-Request* sobre Tomcat, donde 200 peticiones consumen 200 MB de stack), **Spring WebFlux opera sobre un bucle de eventos no bloqueante**.
- **Consumo Mínimo de Recursos:** Toda la JVM de Spring WebFlux corre con un consumo estable de **~250 MB de RAM**, permitiendo que miles de operarios y usuarios web consulten datos concurrentemente sin degradación.
- **Tipos de Retorno Reactivos:**
  - `Mono<T>`: Retorna 0 o 1 elemento de forma asíncrona (usado en búsquedas por ID, guardado o actualización).
  - `Flux<T>`: Emite una secuencia de 0 a N elementos como flujo continuo no bloqueante (usado en listados y catálogos).

#### Pregunta 3: ¿Por qué NodePorts 30000-30002 y no LoadBalancer externo?
1. **Eficiencia de Costos en la Nube:** Un recurso `LoadBalancer` en AWS aprovisiona un Classic / Network Load Balancer que genera un costo fijo por hora ($0.0225/hora + LCU). Con **NodePort**, se aprovecha la infraestructura nativa de K3s sin costos ocultos.
2. **K3s Kube-Proxy & Service Routing:** K3s abre el puerto (`30000`, `30001`, `30002`) en **todas las interfaces de red de todos los nodos del clúster**. Cualquier solicitud enviada a la IP pública de cualquier nodo es redirigida internamente por iptables/IPVS hacia el pod correspondiente, garantizando alta disponibilidad.

---

### 1.3. Topología de Red y Arquitectura de Cómputo en AWS

```
                            USUARIO EXTERNO / DOCENTE / EVALUADOR
                                             |
          +----------------------------------+----------------------------------+
          |                                  |                                  |
          v                                  v                                  v
http://IP_PUB_NODE:30000          http://IP_PUB_NODE:30001          http://IP_PUB_NODE:30002
 (Frontend React + Nginx)         (Swagger UI Spring Boot)          (OpenAPI Docs Flask)
                                                                                ^
                                                                                |
                                                             App Móvil (Expo React Native)

+---------------------------------------------------------------------------------------+
|                           VPC AWS (172.31.0.0/16) — us-east-1                         |
|                                                                                       |
|  [k8s-master] --------------------+ (Join Token: agropacayales-token-2026)            |
|  Control Plane K3s (t3.small)     |                                                   |
|  IP Privada: 172.31.X.X           |                                                   |
|                                   |                                                   |
|  [k8s-node-frontend] <------------+ DNS interno Kubernetes:                           |
|  Worker 1: role=frontend          | proxy_pass http://backend-transaccional:8081      |
|  Nginx + React SPA (:80)          | proxy_pass http://backend-analitico:5000          |
|                                   |                                                   |
|  [k8s-node-backend] <-------------+ Eventos HTTP asíncronos:                          |
|  Worker 2: role=backend1          | POST http://backend-analitico:5000/api/v1/...     |
|  Spring WebFlux (:8081)           |                                                   |
|                                   |                                                   |
|  [k8s-node-backendAnalitico] <----+                                                   |
|  Worker 3: role=backend2          |                                                   |
|  Python Flask Gunicorn (:5000)    |                                                   |
|                                   |                                                   |
|                  +----------------+----------------+                                  |
|                  |                                 |                                  |
|                  v (Puerto 1433)                   v (Puerto 27017)                   |
|         [Amazon RDS SQL Server]            [ec2-mongodb]                              |
|         db.t3.micro (Express)              EC2 Dedicado (Ubuntu 24.04)                |
|         Base: agropacayales_db             Base: agropacayales_db                     |
+---------------------------------------------------------------------------------------+
```

---

### 1.4. Matriz Maestra de Parámetros, Puertos y Credenciales

| Componente | Parámetro | Valor de Configuración Oficial | Dónde se Aplica |
| :--- | :--- | :--- | :--- |
| **Docker Hub** | Repositorio / Tag | `hugo454/agropacayales-*:2.0` | Deployments Kubernetes |
| **Namespace K8s** | Nombre | `agropacayales-namespace` | Todos los manifiestos |
| **RDS SQL Server** | Motor / Clase | SQL Server 2022 Express / `db.t3.micro` | Consola RDS AWS |
| **RDS SQL Server** | Base de Datos | `agropacayales_db` | ConfigMap / SSMS |
| **RDS SQL Server** | Usuario / Clave | `admin` / `AgroPacayales2026!` | Secret K8s / SSMS |
| **MongoDB EC2** | Puerto / Base | `27017` / `agropacayales_db` | Secret K8s / URI conexión |
| **MongoDB EC2** | Usuario / Clave | `admin` / `Mongo12345` | Secret K8s / `mongosh` |
| **K3s Cluster** | Token de Conexión | `agropacayales-token-2026` | Join de Workers a Master |
| **NodePort Front** | Puerto Externo | `30000` | Browser / Frontend SPA |
| **NodePort Back 1**| Puerto Externo | `30001` | Swagger / App Móvil |
| **NodePort Back 2**| Puerto Externo | `30002` | OpenAPI / App Móvil |

---

## 2. Aprovisionamiento Automatizado en AWS con User Data (Cero SSH Manual)

### 2.1. ¿Qué es el User Data y por qué automatiza todo el despliegue?

En AWS EC2, **User Data** (`cloud-init`) es una funcionalidad que permite ejecutar un script Bash con privilegios de `root` automáticamente durante el primer encendido de la máquina.
- **¿Por qué es superior?**
  1. **Ahorro masivo de tiempo:** No tienes que conectarte por SSH a 4 terminales diferentes a escribir comandos.
  2. **Cero errores humanos:** Elimina el riesgo de equivocarse escribiendo una ruta o contraseña.
  3. **Demostración de madurez DevOps:** El jurado valora enormemente el aprovisionamiento automatizado tipo *Infrastructure as Code*.

> **¿Dónde se coloca en AWS?**  
> Al momento de lanzar cada instancia EC2, ve a la sección inferior:  
> **Detalles avanzados (Advanced Details)** ➔ baja hasta el último cuadro: **Datos del usuario (User data)** ➔ **Pega el script correspondiente**.

---

### 2.2. Paso 1: Amazon RDS Microsoft SQL Server 2022

> [!TIP]
> Inicia este paso primero porque AWS toma ~12 minutos en aprovisionar la instancia RDS.

1. En la consola de AWS (Región: `us-east-1`), ve a **RDS** ➔ **Bases de datos** ➔ botón naranja **Crear base de datos**.
2. **Parámetros exactos:**
   - **Método de creación:** Creación estándar.
   - **Motor:** Microsoft SQL Server ➔ Edición: **SQL Server Express Edition**.
   - **Versión:** SQL Server 2022 (16.00.xxxx).
   - **Identificador de base de datos:** `agropacayales-sqlserver`.
   - **Usuario maestro:** `admin`.
   - **Contraseña maestra:** `AgroPacayales2026!`.
   - **Clase de instancia:** `db.t3.micro` (1 vCPU, 1 GB RAM).
   - **Almacenamiento:** General Purpose SSD (gp2), 20 GiB (desactivar auto-escalado).
   - **Conectividad:** VPC por defecto, Acceso público: **Sí** (para conectarte desde SSMS), Grupo de seguridad: Crear nuevo `rds-sg` con puerto `1433`.
3. Una vez en estado **Disponible**, copia el **Endpoint de conexión** (ej: `agropacayales-sqlserver.c3...us-east-1.rds.amazonaws.com`).
4. Conéctate desde SQL Server Management Studio (SSMS) con usuario `admin` y ejecuta:
   ```sql
   CREATE DATABASE agropacayales_db;
   GO
   ```

---

### 2.3. Paso 2: Matriz de Reglas de Seguridad (Security Groups de AWS)

En la consola de AWS EC2 ➔ **Security Groups** ➔ **Reglas de entrada (Inbound Rules)**:

| Security Group | Tipo de Tráfico | Rango de Puertos | Origen (CIDR) | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **`k8s-cluster-sg`** | SSH | `22` | `0.0.0.0/0` | Conexión terminal remota |
| **`k8s-cluster-sg`** | Kubernetes API | `6443` | `172.31.0.0/16` | Comunicación K3s Master ➔ Workers |
| **`k8s-cluster-sg`** | Custom TCP | `30000 - 30002` | `0.0.0.0/0` | **NodePorts para Web, Back 1 y Back 2** |
| **`k8s-cluster-sg`** | Flannel Overlay | `8472` (UDP) | `172.31.0.0/16` | Red interna de pods entre nodos |
| **`k8s-cluster-sg`** | Kubelet Metrics | `10250` | `172.31.0.0/16` | Monitoreo y logs de pods |
| **`mongodb-sg`** | MongoDB | `27017` | `0.0.0.0/0` | Conexión desde Backend 1 y mongosh |
| **`rds-sg`** | MS SQL Server | `1433` | `0.0.0.0/0` | Conexión desde Spring Boot R2DBC |

---

### 2.4. Paso 3: Servidor MongoDB 8.0 (Script User Data Autoinstalable)

Al lanzar la instancia `ec2-mongodb-agropacayales` (`t3.small`, Ubuntu 24.04 LTS, SG: `mongodb-sg`):  
Pega este script en **Datos del usuario (User data)**. La máquina arrancará con MongoDB 8.0 instalado, configurado con `bindIp: 0.0.0.0`, autenticación activada y los usuarios `admin` creados:

```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

echo "Iniciando aprovisionamiento automatizado de MongoDB 8.0..."

# 1. Dependencias y llave GPG oficial
apt-get update -y
apt-get install -y gnupg curl

curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor --yes

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  tee /etc/apt/sources.list.d/mongodb-org-8.0.list

apt-get update -y
apt-get install -y mongodb-org

# 2. Iniciar servicio sin autenticacion para crear credenciales iniciales
systemctl start mongod
systemctl enable mongod

until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  sleep 2
done

# 3. Crear usuario administrador del cluster
mongosh admin --eval '
db.createUser({
  user: "admin",
  pwd: "Mongo12345",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
});
'

# 4. Crear usuario de la base de datos de aplicacion
mongosh agropacayales_db --eval '
db.createUser({
  user: "admin",
  pwd: "Mongo12345",
  roles: [{ role: "readWrite", db: "agropacayales_db" }]
});
'

# 5. Habilitar bindIp 0.0.0.0 y seguridad en /etc/mongod.conf
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
processManagement:
  timeZoneInfo: /usr/share/zoneinfo
security:
  authorization: enabled
EOF

# 6. Reiniciar servicio
systemctl restart mongod
echo "MongoDB 8.0 instalado y securizado con exito."
```

---

### 2.5. Paso 4: Servidor K3s Master (Script User Data Autoinstalable)

Al lanzar la instancia `k8s-master` (`t3.small`, Ubuntu 24.04 LTS, SG: `k8s-cluster-sg`):  
Pega este script en **Datos del usuario (User data)**. La máquina arrancará con K3s Server listo, token configurado (`agropacayales-token-2026`), permisos de `kubectl` listos para el usuario `ubuntu` y alias configurados:

```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

echo "Iniciando instalacion automatizada de K3s Control Plane Master..."

# 1. Instalar K3s Server con token fijo
curl -sfL https://get.k3s.io | K3S_TOKEN="agropacayales-token-2026" sh -s - server \
  --disable traefik \
  --disable servicelb \
  --node-name k8s-master \
  --write-kubeconfig-mode 644

# 2. Configurar kubeconfig para el usuario ubuntu
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube

# 3. Aliases y autocompletado
echo "export KUBECONFIG=/home/ubuntu/.kube/config" >> /home/ubuntu/.bashrc
echo "alias k=kubectl" >> /home/ubuntu/.bashrc
echo "complete -F __start_kubectl k" >> /home/ubuntu/.bashrc

echo "K3s Master listo para recibir workers."
```

---

### 2.6. Paso 5: Workers K3s con Auto-Etiquetado (Scripts User Data para los 3 Nodos)

> [!IMPORTANT]
> **REEMPLAZO OBLIGATORIO:** En los 3 scripts de abajo, reemplaza `<IP_PRIVADA_MASTER>` por la IP interna de tu nodo Master (ejemplo: `172.31.21.112`).
> **VENTAJA EXTRAORDINARIA:** Gracias a la bandera `--node-label`, ¡los workers se unen al clúster **ya etiquetados con su rol correspondiente** automáticamente sin que tengas que ejecutar `kubectl label node`!

#### A) User Data para Worker 1: Frontend (`k8s-node-frontend` — `t3.small`)
```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 \
  K3S_TOKEN="agropacayales-token-2026" sh -s - agent \
  --node-name k8s-node-frontend \
  --node-label role=frontend
```

#### B) User Data para Worker 2: Backend 1 WebFlux (`k8s-node-backend` — `t3.medium`)
```bash
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 \
  K3S_TOKEN="agropacayales-token-2026" sh -s - agent \
  --node-name k8s-node-backend \
  --node-label role=backend1
```

#### C) User Data para Worker 3: Backend 2 Analítico (`k8s-node-backendAnalitico` — `t3.small`)
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

### 2.7. Método Alternativo: Comandos Manuales por SSH (Si no usas User Data)

Si por alguna razón decides no usar User Data y prefieres ingresar por SSH:

#### En el Master:
```bash
curl -sfL https://get.k3s.io | K3S_TOKEN="agropacayales-token-2026" sh -s - server \
  --disable traefik \
  --disable servicelb \
  --node-name k8s-master
mkdir -p ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config
echo "export KUBECONFIG=~/.kube/config" >> ~/.bashrc && source ~/.bashrc
```

#### En cada Worker:
```bash
curl -sfL https://get.k3s.io | K3S_URL=https://<IP_PRIVADA_MASTER>:6443 K3S_TOKEN="agropacayales-token-2026" sh -
```

#### Etiquetar desde el Master:
```bash
kubectl label nodes <NOMBRE_NODO_FRONTEND> role=frontend --overwrite
kubectl label nodes <NOMBRE_NODO_BACKEND1> role=backend1 --overwrite
kubectl label nodes <NOMBRE_NODO_BACKEND2> role=backend2 --overwrite
```

---

## 3. Empaquetado de Contenedores Docker Hub (Versión Oficial 2.0)

### 3.1. Imágenes Oficiales y Nginx Reverse Proxy

Todas las imágenes se encuentran subidas y verificadas en Docker Hub:
- `hugo454/agropacayales-frontend:2.0` (y `:latest`)
- `hugo454/agropacayales-backend1:2.0` (y `:latest`)
- `hugo454/agropacayales-backend-analitico:2.0` (y `:latest`)

#### Nginx Reverse Proxy del Frontend (`ASE251S3_T05-fe/nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # Proxy inverso transparente hacia Backend 1 (Spring Boot WebFlux)
    location /api/ {
        proxy_pass http://backend-transaccional:8081/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Proxy inverso transparente hacia Backend 2 (Flask Analítico)
    location /analytics/ {
        proxy_pass http://backend-analitico:5000/api/v1/analytics/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

### 3.2. Scripts de Automatización Local (.bat)

Ubicados en la raíz del repositorio para compilar y subir si realizas cambios locales:

#### `build-all-images.bat`:
```cmd
@echo off
cd /d "e:\Nueva carpeta (8)\tcc\ASE251S3_T05-fe"
docker build -t hugo454/agropacayales-frontend:2.0 -t hugo454/agropacayales-frontend:latest .

cd /d "e:\Nueva carpeta (8)\tcc\ASE251S4_T05-be"
docker build -t hugo454/agropacayales-backend1:2.0 -t hugo454/agropacayales-backend1:latest .

cd /d "e:\Nueva carpeta (8)\tcc\ASE251S4_T05-be-analitico"
docker build -t hugo454/agropacayales-backend-analitico:2.0 -t hugo454/agropacayales-backend-analitico:latest .
```

#### `push-images-2.0.bat`:
```cmd
@echo off
docker push hugo454/agropacayales-frontend:2.0
docker push hugo454/agropacayales-frontend:latest
docker push hugo454/agropacayales-backend1:2.0
docker push hugo454/agropacayales-backend1:latest
docker push hugo454/agropacayales-backend-analitico:2.0
docker push hugo454/agropacayales-backend-analitico:latest
```

---

## 4. Manifiesto Maestro de Kubernetes y Despliegue en K3s

### 4.1. Manifiesto Completo Todo-en-Uno (`agropacayales-k8s-all-in-one.yml`)

Disponible en el repositorio en `k8s-manifests/agropacayales-k8s-all-in-one.yml` o para copiar y pegar:

```yaml
# ==============================================================================
# AGROPACAYALES S.A.C. — MANIFIESTO MAESTRO KUBERNETES K3S (AWS)
# ==============================================================================

# 1. NAMESPACE AISLADO
apiVersion: v1
kind: Namespace
metadata:
  name: agropacayales-namespace
---
# 2. CONFIGMAP (Configuración no sensible)
apiVersion: v1
kind: ConfigMap
metadata:
  name: agropacayales-configmap
  namespace: agropacayales-namespace
data:
  # Backend 1 Transaccional
  SERVER_PORT: "8081"
  SPRING_PROFILES_ACTIVE: "cloud"
  MONGO_DATABASE: "agropacayales_db"
  SQL_HOST: "ENDPOINT_DE_TU_RDS_AQUI"
  SQL_PORT: "1433"
  SQL_DATABASE: "agropacayales_db"
  SQL_USERNAME: "admin"
  ANALYTICS_URL: "http://backend-analitico:5000"
  ANALYTICS_EVENTS_ENABLED: "true"

  # Backend 2 Analítico
  FLASK_PORT: "5000"
  MONGO_DB_NAME: "agropacayales_db"
  SQL_SERVER: "ENDPOINT_DE_TU_RDS_AQUI"
  SQL_USER: "admin"
---
# 3. SECRET (Credenciales en Base64 o StringData seguro)
apiVersion: v1
kind: Secret
metadata:
  name: agropacayales-secret
  namespace: agropacayales-namespace
type: Opaque
stringData:
  MONGO_URI: "mongodb://admin:Mongo12345@IP_PRIVADA_DE_MONGO_AQUI:27017/agropacayales_db?authSource=admin"
  SQL_PASSWORD: "AgroPacayales2026!"
---
# 4. BACKEND 1 TRANSACCIONAL (Spring Boot 3.4 WebFlux)
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
        image: hugo454/agropacayales-backend1:2.0
        imagePullPolicy: Always
        ports:
        - containerPort: 8081
        envFrom:
        - configMapRef:
            name: agropacayales-configmap
        - secretRef:
            name: agropacayales-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "768Mi"
            cpu: "1000m"
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
# 5. BACKEND 2 ANALÍTICO (Python 3.11 Flask & Pandas)
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
        resources:
          requests:
            memory: "128Mi"
            cpu: "150m"
          limits:
            memory: "512Mi"
            cpu: "800m"
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
# 6. FRONTEND WEB (React 19 + TypeScript + Nginx)
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
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "300m"
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

---

### 4.2. Comandos de Despliegue y Verificación en el Master

En el nodo Master:
```bash
# 1. Aplicar el manifiesto completo
kubectl apply -f k8s-manifests/agropacayales-k8s-all-in-one.yml

# 2. Monitorear los pods en tiempo real
kubectl get pods -n agropacayales-namespace -o wide -w

# 3. Validar servicios NodePort activos
kubectl get svc -n agropacayales-namespace
```

---

## 5. Guía Exhaustiva de Pruebas en Swagger UI (Backend 1 - Spring Boot)

### 5.1. Acceso al Portal Interactivo Swagger UI

- **URL de Swagger:**
  ```text
  http://<IP_PUBLICA_AWS>:30001/webjars/swagger-ui/index.html
  ```

---

### 5.2. Módulo de Parcelas (`/api/parcelas` — MongoDB `plots`)

#### A) `POST /api/parcelas` — Crear Parcela
```json
{
  "id": "PARC-NOR-999",
  "nombre": "Sector Norte - Lote Experimental 999",
  "ubicacion": "Fundo AgroPacayales, Km 118 Panamericana Sur",
  "areaHectareas": 8.50,
  "hectareas": 8.50,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Carlos Mendoza",
  "estadoRiego": "En Proceso",
  "cultivoActual": "Palta Hass Exportación",
  "produccionEstimada": "45 toneladas",
  "fechaUltimaSiembra": "2026-03-15",
  "observaciones": "Lote acondicionado para validación de riego por pulso y micronutrientes.",
  "enUso": true,
  "estado": true,
  "condicionesEdaficas": {
    "textura": "Franco Arenoso",
    "phPromedio": 6.8,
    "materiaOrganicaPct": 2.45
  },
  "sistemaRiego": {
    "tipo": "Goteo",
    "caudalLph": 1.75,
    "sectorValvula": "VALV-EXP-01"
  }
}
```

#### B) `PUT /api/parcelas/{id}` — Actualizar Parcela (`PARC-NOR-999`)
```json
{
  "id": "PARC-NOR-999",
  "nombre": "Sector Norte - Lote Experimental 999 (Actualizado)",
  "ubicacion": "Fundo AgroPacayales, Km 118 Panamericana Sur",
  "areaHectareas": 8.50,
  "hectareas": 8.50,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Carlos Mendoza",
  "estadoRiego": "Optimizado",
  "cultivoActual": "Palta Hass Exportación",
  "produccionEstimada": "50 toneladas",
  "fechaUltimaSiembra": "2026-03-15",
  "observaciones": "Monitoreo completado satisfactoriamente.",
  "enUso": true,
  "estado": true
}
```

#### C) `GET /api/parcelas` y `DELETE /api/parcelas/{id}`
- `GET /api/parcelas`: Retorna el flujo reactivo JSON (`Flux<Parcela>`).
- `DELETE /api/parcelas/PARC-NOR-999`: Elimina la parcela de la base de datos.

---

### 5.3. Módulo de Insumos Agrícolas (`/api/insumos` — MongoDB `supplies`)

#### A) `POST /api/insumos` — Crear Insumo
```json
{
  "id": "INS-FERT-999",
  "nombre": "Bioestimulante Radicular RaizMax Pro",
  "categoria": "Fertilizantes",
  "unidadMedida": "Litros",
  "stock": 150.0,
  "stockMinimo": 20.0,
  "precioUnitario": 48.50,
  "proveedor": "Agroquímica del Pacífico S.A.",
  "descripcion": "Concentrado soluble rico en ácidos húmicos y fósforo asimilable.",
  "estado": true,
  "propiedadesQuimicas": {
    "composicion": "Ácidos fúlvicos 15%, Fósforo P2O5 30%",
    "phSolucion": 6.2,
    "densidadGml": 1.25
  }
}
```

#### B) `PUT /api/insumos/{id}` — Actualizar Stock (`INS-FERT-999`)
```json
{
  "id": "INS-FERT-999",
  "nombre": "Bioestimulante Radicular RaizMax Pro",
  "categoria": "Fertilizantes",
  "unidadMedida": "Litros",
  "stock": 135.0,
  "stockMinimo": 20.0,
  "precioUnitario": 48.50,
  "proveedor": "Agroquímica del Pacífico S.A.",
  "descripcion": "Stock actualizado tras labor de fertirriego en Lote 999.",
  "estado": true
}
```

---

### 5.4. Módulo de Usuarios y Personal (`/api/usuarios` — MongoDB `users`)

#### A) `POST /api/usuarios` — Registrar Personal
```json
{
  "id": "USR-TEC-999",
  "username": "cmendoza",
  "email": "carlos.mendoza@agropacayales.com",
  "nombre": "Carlos",
  "apellido": "Mendoza Huamán",
  "rol": "AGRONOMO",
  "dni": "45879632",
  "telefono": "+51 987654321",
  "activo": true,
  "certificaciones": [
    "Manejo Integrado de Plagas SENASA",
    "Certificación GlobalG.A.P. V5"
  ]
}
```

---

### 5.5. Módulo de Fichas de Campo (`/api/fichas-campo` — MongoDB `field_records`)

#### A) `POST /api/fichas-campo` — Registrar Evaluación Fitosanitaria
```json
{
  "codigoFicha": "FICHA-EVAL-2026-999",
  "nombreCultivo": "Palta Hass",
  "idParcela": "PARC-NOR-999",
  "etapaFenologica": "Floración",
  "estadoCultivo": "Excelente",
  "condicionClima": "Soleado",
  "temperaturaAmb": 24.5,
  "humedadRelativa": 68.0,
  "necesitaRiego": false,
  "necesitaFumigacion": false,
  "diagnostico": "Se observa brotación floral uniforme y óptimo anclaje radicular. Sin presencia de patógenos.",
  "responsableTecnico": "Ing. Carlos Mendoza",
  "fechaRegistro": "2026-10-26"
}
```

---

### 5.6. Módulo de Cosechas (`/api/harvest` — SQL Server)

#### A) `POST /api/harvest` — Registrar Cosecha
```json
{
  "idCultivo": 1,
  "fechaCosecha": "2026-10-26",
  "kilosTotales": 8500.50,
  "kilosPrimera": 7200.00,
  "kilosSegunda": 1100.50,
  "kilosMerma": 200.00,
  "responsable": "Ing. Carlos Mendoza",
  "observaciones": "Cosecha de lote piloto con destino exportación a Rotterdam."
}
```

---

### 5.7. Módulo de Actividades de Cultivo (`/api/actividades-cultivos` — SQL Server)

#### A) `POST /api/actividades-cultivos` — Programar Labor
```json
{
  "idCultivo": 1,
  "idTipoLabor": 2,
  "descripcion": "Fertirriego por goteo con Bioestimulante RaizMax",
  "fechaProgramada": "2026-10-27",
  "responsable": "Axel Huapaya",
  "estado": "PENDIENTE",
  "insumosUtilizados": [
    {
      "idInsumo": "INS-FERT-999",
      "cantidadRequerida": 15.0
    }
  ]
}
```

#### B) `PATCH /api/actividades-cultivos/{id}/finalizar` — Culminar Labor
- Este endpoint cambia el estado a `COMPLETADO` en SQL Server y rebaja automáticamente el stock del insumo en MongoDB.

---

### 5.8. Módulo de Asignaciones de Personal (`/api/asignaciones-trabajadores`)

#### A) `POST /api/asignaciones-trabajadores` — Asignar Cuadrilla
```json
{
  "idParcela": "PARC-NOR-999",
  "idActividad": 1,
  "fechaAsignacion": "2026-10-27",
  "jornalHoras": 8,
  "trabajadoresIds": ["USR-TEC-999", "USR-OPE-001"]
}
```

---

## 6. Operaciones CRUD Directas en Consola MongoDB (`mongosh`)

### 6.1. Conexión y Regla de Oro: ¿Por qué en Mongo es `_id` y en el JSON es `id`?

Conéctate por SSH a la máquina de MongoDB y abre la consola interactiva:
```bash
mongosh "mongodb://admin:Mongo12345@localhost:27017/agropacayales_db?authSource=admin"
```

> [!CAUTION]
> **REGLA DE ORO DE CONSULTAS EN MONGODB:**
> - En MongoDB, la clave primaria inmutable es **`_id`**.
> - En la clase Java de Spring Boot (`Parcela.java`), el atributo está anotado con `@Id private String id;`.
> - Spring Data MongoDB mapea el campo `_id` de la base de datos hacia la propiedad `id` del JSON.
> - **Por tanto:** Si buscas en la consola `mongosh`, debes consultar por **`_id`**:
>   ```javascript
>   db.plots.find({ _id: "PARC-NOR-999" }) // CORRECTO (devuelve el documento)
>   db.plots.find({ id: "PARC-NOR-999" })  // INCORRECTO (devuelve vacío)
>   ```

---

### 6.2. CRUD Completo: Colección `plots` (Parcelas)

```javascript
// 1. CREATE (Insertar nueva parcela)
db.plots.insertOne({
  _id: "PARC-NOR-999",
  nombre: "Sector Norte - Lote Experimental 999",
  ubicacion: "Fundo AgroPacayales, Km 118",
  areaHectareas: 8.50,
  hectareas: 8.50,
  tipoSuelo: "Franco Arenoso",
  responsable: "Ing. Carlos Mendoza",
  cultivoActual: "Palta Hass Exportación",
  estadoRiego: "En Proceso",
  enUso: true,
  estado: true,
  condicionesEdaficas: { textura: "Franco Arenoso", phPromedio: 6.8, materiaOrganicaPct: 2.45 },
  sistemaRiego: { tipo: "Goteo", caudalLph: 1.75, sectorValvula: "VALV-EXP-01" },
  createdAt: new Date()
})

// 2. READ (Listar y Filtrar)
db.plots.find({ estado: true })
db.plots.find({ _id: "PARC-NOR-999" })

// 3. UPDATE (Actualizar estado de riego y observaciones)
db.plots.updateOne(
  { _id: "PARC-NOR-999" },
  {
    $set: {
      estadoRiego: "Optimizado",
      observaciones: "Actualizado desde consola mongosh en demostración técnica",
      updatedAt: new Date()
    }
  }
)

// 4. DELETE (Eliminación física)
db.plots.deleteOne({ _id: "PARC-NOR-999" })
```

---

### 6.3. CRUD Completo: Colección `supplies` (Insumos)

```javascript
// 1. CREATE
db.supplies.insertOne({
  _id: "INS-FERT-999",
  nombre: "Bioestimulante Radicular RaizMax Pro",
  categoria: "Fertilizantes",
  unidadMedida: "Litros",
  stock: 150.0,
  stockMinimo: 20.0,
  precioUnitario: 48.50,
  proveedor: "Agroquímica del Pacífico S.A.",
  estado: true,
  createdAt: new Date()
})

// 2. READ (Alerta de Stock Crítico)
db.supplies.find({ $expr: { $lte: ["$stock", "$stockMinimo"] } })

// 3. UPDATE (Decrementar stock de forma atómica con $inc)
db.supplies.updateOne(
  { _id: "INS-FERT-999" },
  { $inc: { stock: -15.0 } }
)

// 4. DELETE
db.supplies.deleteOne({ _id: "INS-FERT-999" })
```

---

### 6.4. CRUD Completo: Colección `users` (Usuarios)

```javascript
// 1. CREATE
db.users.insertOne({
  _id: "USR-TEC-999",
  username: "cmendoza",
  email: "carlos.mendoza@agropacayales.com",
  nombre: "Carlos",
  apellido: "Mendoza Huamán",
  rol: "AGRONOMO",
  dni: "45879632",
  activo: true,
  createdAt: new Date()
})

// 2. READ
db.users.find({ rol: "AGRONOMO", activo: true })

// 3. UPDATE
db.users.updateOne(
  { _id: "USR-TEC-999" },
  { $set: { telefono: "+51 987654321", updatedAt: new Date() } }
)

// 4. DELETE
db.users.deleteOne({ _id: "USR-TEC-999" })
```

---

### 6.5. CRUD Completo: Colección `field_records` (Fichas de Campo)

```javascript
// 1. CREATE
db.field_records.insertOne({
  codigoFicha: "FICHA-EVAL-2026-999",
  nombreCultivo: "Palta Hass",
  idParcela: "PARC-NOR-999",
  etapaFenologica: "Floración",
  estadoCultivo: "Excelente",
  temperaturaAmb: 24.5,
  humedadRelativa: 68.0,
  necesitaRiego: false,
  necesitaFumigacion: false,
  diagnostico: "Evaluación presencial satisfactoria.",
  responsableTecnico: "Ing. Carlos Mendoza",
  fechaRegistro: new Date()
})

// 2. READ (Obtener última evaluación para el monitor fenológico)
db.field_records.find({ nombreCultivo: "Palta Hass" }).sort({ fechaRegistro: -1 }).limit(1)
```

---

## 7. Validación y Endpoints de Backend 2 (Python Flask Analítico)

El Backend 2 ejecuta algoritmos en Pandas y NumPy sobre los datos transaccionales para generar 18 indicadores clave expuestos en el **NodePort 30002**:

- **Documentación OpenAPI:**
  ```text
  http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/docs/
  ```

#### Comandos de prueba con `curl`:
```bash
# 1. Métricas de Rendimiento por Cultivo (ID 1)
curl -s http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/cultivo/1/metrics | jq .

# 2. Resumen General Ejecutivo (Tarjetas del Dashboard)
curl -s http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/general/cards | jq .

# 3. Estructura de Costos Operativos Acumulados
curl -s http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/general/distribucion-costos | jq .

# 4. Tendencia de Producción y Cosecha Mensual
curl -s http://<IP_PUBLICA_AWS>:30002/api/v1/analytics/general/produccion-mensual | jq .
```

---

## 8. Despliegue y Operación de la Aplicación Móvil (Expo React Native)

### 8.1. Configuración de Variables de Entorno (`.env`)

Abre el archivo:
`e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile\.env`

Coloca la IP pública actual de tu servidor AWS:
```env
EXPO_PUBLIC_API_URL=http://<IP_PUBLICA_AWS>:30001/api
EXPO_PUBLIC_ANALYTICS_URL=http://<IP_PUBLICA_AWS>:30002/api/v1/analytics
```

> [!WARNING]
> **PASO CRÍTICO TRAS EDITAR EL `.env`:**
> Expo compila las variables de entorno en el arranque. Si modificas el archivo `.env`, debes **detener la terminal (`Ctrl + C`)** y reiniciar con limpieza de caché:
> ```powershell
> npx expo start -c
> ```

---

### 8.2. Ejecución y Modos de Prueba (Web Frame, Expo Go en Smartphone, Emulador)

#### MODO 1: En tu Laptop con Simulador de Smartphone de Lujo 🌟 *(Recomendado para Sustentación)*
1. En la terminal de Expo, presiona la tecla **`w`**.
2. Se abrirá automáticamente Google Chrome en `http://localhost:8081`.
3. Verás la app móvil enmarcada en un **smartphone de alta gama centrado** (`max-width: 520px`), con laterales en tono Deep Earth Brown (`#1A110B`), bisel superior con bocina y cámara frontal. Puedes interactuar fluidamente con el mouse simulando toques táctiles.

#### MODO 2: En tu Celular Físico (Android o iPhone)
1. Instala la app gratuita **Expo Go** desde Google Play Store o App Store.
2. Escanea el código QR de la terminal:
   - En Android: Abre Expo Go y toca **"Scan QR Code"**.
   - En iPhone: Abre la cámara nativa de iOS y toca el enlace de Expo.
3. La aplicación se abrirá en tu teléfono al 100% de la pantalla nativa. Como apunta a la IP pública de AWS (`:30001`), funciona con Wi-Fi o con datos móviles 4G/5G.

---

### 8.3. Flujo Diario del Operario en 1 Clic

1. **Acceso Rápido a "+ Nueva Ficha de Campo":** En la cabecera de la pantalla de inicio, un botón verde esmeralda permite abrir el formulario fitosanitario (`/fichas-campo/formulario`) y guardar directo en MongoDB.
2. **Ciclo de Tareas Táctil en 1 Clic (`/mis-labores`):**
   $$\mathbf{[Pendiente]} \;\longrightarrow\; \mathbf{[En\; Proceso]} \;\longrightarrow\; \mathbf{[Completado]}$$
   - Al tocar **`[En Proceso]`**: La labor se destaca en amarillo ámbar para el operario.
   - Al tocar **`[Completado]`**: Se muestra un diálogo de confirmación, se invoca `PATCH /api/actividades-cultivos/{id}/finalizar`, la tarea cambia a verde con check de éxito y en MongoDB se descuenta automáticamente el stock del insumo utilizado.

---

### 8.4. Diagnóstico y Solución de Errores Comunes en Móvil

| Síntoma / Error | Causa Probable | Solución Inmediata |
| :--- | :--- | :--- |
| **"No se pudo conectar con el servidor (:30001)"** | Security Group de AWS cerrado o IP pública cambió tras reiniciar la máquina EC2. | Actualiza la IP pública en `.env`, verifica el puerto `30001` en Security Groups y reinicia con `npx expo start -c`. |
| **"Modifiqué el `.env` pero sigue llamando a la IP vieja"** | Caché activa en Metro Bundler. | Detén con `Ctrl + C` y ejecuta obligatoriamente `npx expo start -c`. |
| **"Network request failed" en el celular** | Pusiste `localhost` en el `.env` en vez de la IP pública de AWS. | Reemplaza `localhost` por la IP pública de AWS en `.env`. |

---

## 9. Batería de Demostraciones en Vivo de Kubernetes para la Sustentación

Esta sección está diseñada con los comandos exactos y las justificaciones teóricas para cada una de las pruebas que los jurados y evaluadores suelen solicitar en vivo.

---

### 9.1. DEMO 1: Auto-Recuperación y Resiliencia (Self-Healing en 2 segundos)

> **Qué pide el jurado:** *"Mata el pod del frontend o del backend a ver si el sistema se cae o si Kubernetes lo recupera."*

#### Comando a ejecutar en vivo:
```bash
# 1. En una terminal, deja observando los pods en tiempo real:
kubectl get pods -n agropacayales-namespace -w

# 2. En otra terminal, elimina intencionalmente el pod del backend:
kubectl delete pod -l app=backend-transaccional -n agropacayales-namespace
```

#### Qué observarás en la pantalla:
El pod anterior entra en estado `Terminating`, e **instantáneamente (en menos de 1 segundo)** Kubernetes crea un nuevo pod con otro identificador en estado `Pending` ➔ `ContainerCreating` ➔ `Running`.

#### Qué explicar al jurado:
> *"El controlador de ReplicaSet de Kubernetes vigila continuamente la brecha entre el estado deseado (replicas: 1) y el estado real del clúster. Al detectar la muerte del pod, el bucle de reconciliación programa automáticamente un pod de reemplazo en el nodo asignado sin que el usuario experimente indisponibilidad del servicio."*

---

### 9.2. DEMO 2: Escalabilidad Horizontal en Caliente (HPA / Pod Replica Scaling)

> **Qué pide el jurado:** *"Imaginen que estamos en plena campaña de cosecha y entran 5,000 operarios a registrar datos. Escalemos el backend para soportar la carga."*

#### Comando a ejecutar en vivo:
```bash
# 1. Escalar el backend de 1 a 3 réplicas en caliente:
kubectl scale deployment backend-transaccional --replicas=3 -n agropacayales-namespace

# 2. Verificar que ahora hay 3 pods corriendo en paralelo:
kubectl get pods -n agropacayales-namespace -o wide
```

#### Qué observarás:
Verás aparecer `backend-transaccional-xxxx-1`, `backend-transaccional-xxxx-2` y `backend-transaccional-xxxx-3`, todos en estado `Running`.

#### Qué explicar al jurado:
> *"El Service `backend-transaccional` en el puerto `8081` actúa como un balanceador de carga interno L4 (iptables/IPVS). Las peticiones provenientes del Frontend o de la App Móvil se distribuyen mediante Round-Robin entre los 3 pods reactivos, triplicando la capacidad de atención en milisegundos."*

#### Comando para volver a 1 réplica al culminar la prueba:
```bash
kubectl scale deployment backend-transaccional --replicas=1 -n agropacayales-namespace
```

---

### 9.3. DEMO 3: Despliegue Continuo Sin Caídas (Zero-Downtime Rolling Update)

> **Qué pide el jurado:** *"¿Cómo actualizan el software a una nueva versión sin apagar el clúster ni botar a los usuarios conectados?"*

#### Comando a ejecutar en vivo:
```bash
# Ejecutar actualización continua de la imagen del frontend
kubectl rollout restart deployment/frontend -n agropacayales-namespace

# Ver el progreso de la transición
kubectl rollout status deployment/frontend -n agropacayales-namespace
```

#### Qué explicar al jurado:
> *"Kubernetes utiliza la estrategia RollingUpdate. Primero levanta el contenedor con la nueva versión, ejecuta los chequeos de salud (Readiness Probe), y solo cuando el nuevo contenedor está 100% listo para recibir tráfico, drena y finaliza el pod antiguo. El usuario en el navegador nunca recibe un error 502 o 504."*

---

### 9.4. DEMO 4: Asignación Física de Cargas (NodeSelector & Aislamiento Multi-Nodo)

> **Qué pide el jurado:** *"Demuéstrenme que los pods están distribuidos en servidores físicos distintos y no todos amontonados en la misma máquina."*

#### Comando a ejecutar en vivo:
```bash
kubectl get pods -n agropacayales-namespace -o wide
```

#### Qué mostrar en la columna `NODE`:
| POD | STATUS | IP INTERNA POD | NODO FÍSICO ASIGNADO |
| :--- | :--- | :--- | :--- |
| `frontend-xxxxx` | `Running` | `10.42.1.X` | **`k8s-node-frontend`** |
| `backend-transaccional-xxxxx` | `Running` | `10.42.2.X` | **`k8s-node-backend`** |
| `backend-analitico-xxxxx` | `Running` | `10.42.3.X` | **`k8s-node-backendAnalitico`** |

#### Qué explicar al jurado:
> *"Cada Deployment tiene configurado un bloque `nodeSelector` estricto (`role: frontend`, `role: backend1`, `role: backend2`). Esto garantiza aislamiento de fallos: si el backend analítico consume alta CPU ejecutando cálculos de Pandas, el frontend y las transacciones de campo en Spring Boot permanecen completamente aisladas y fluidas en sus respectivos servidores dedicados."*

---

### 9.5. DEMO 5: Service Discovery y DNS Interno de Kubernetes (CoreDNS)

> **Qué pide el jurado:** *"¿Cómo se comunican el frontend y los dos backends si no usan IPs públicas entre ellos?"*

#### Comando a ejecutar en vivo:
```bash
# Probar llamada interna desde el pod del Frontend hacia el Backend 1 usando su nombre DNS:
kubectl exec -it deployment/frontend -n agropacayales-namespace -- wget -qO- http://backend-transaccional:8081/api/parcelas

# Probar llamada interna desde el Backend 1 hacia el Backend 2:
kubectl exec -it deployment/backend-transaccional -n agropacayales-namespace -- wget -qO- http://backend-analitico:5000/api/v1/analytics/cultivo/1/metrics
```

#### Qué explicar al jurado:
> *"Kubernetes cuenta con CoreDNS integrado. Cada Service genera una entrada DNS privada (ej: `backend-transaccional.agropacayales-namespace.svc.cluster.local`). Los microservicios se descubren y comunican internamente a través de la red overlay de Flannel sin exponer puertos a internet, maximizando la seguridad."*

---

### 9.6. DEMO 6: Seguridad y Desacoplamiento (ConfigMaps & Secrets en Base64)

> **Qué pide el jurado:** *"¿Dónde están guardadas las claves de base de datos? ¿Están quemadas en el código fuente?"*

#### Comando a ejecutar en vivo:
```bash
# 1. Ver la configuración no sensible (ConfigMap):
kubectl get configmap agropacayales-configmap -n agropacayales-namespace -o yaml

# 2. Ver el Secret protegido (valores cifrados):
kubectl get secret agropacayales-secret -n agropacayales-namespace -o yaml

# 3. Demostrar la decodificación en vivo para auditoría:
kubectl get secret agropacayales-secret -n agropacayales-namespace -o jsonpath="{.data.SQL_PASSWORD}" | base64 --decode
echo ""
```

#### Qué explicar al jurado:
> *"Cumplimos con el principio de Twelve-Factor App (III. Configuración). El código fuente y las imágenes de Docker son 100% inmutables y agnósticas. Las credenciales y cadenas de conexión se inyectan en tiempo de ejecución desde Secrets de Kubernetes montados como variables de entorno seguras en memoria."*

---

### 9.7. DEMO 7: Trazabilidad y Logs en Streaming en Tiempo Real

> **Qué pide el jurado:** *"Hagan una operación en la app móvil o en la web y muéstrenme los logs del servidor procesándola en vivo."*

#### Comando a ejecutar en vivo:
```bash
# Ver streaming de logs del Backend 1 (Spring Boot WebFlux):
kubectl logs -f deployment/backend-transaccional -n agropacayales-namespace --tail=50

# Ver streaming de logs del Backend 2 (Flask Analítico):
kubectl logs -f deployment/backend-analitico -n agropacayales-namespace --tail=50

# Ver peticiones Nginx en el Frontend:
kubectl logs -f deployment/frontend -n agropacayales-namespace --tail=50
```

---

### 9.8. DEMO 8: Simulación de Caída de un Servidor Worker en AWS

> **Qué pide el jurado:** *"¿Qué ocurre si un servidor físico de AWS se apaga o sufre un fallo de hardware?"*

#### Pasos de demostración:
1. Conéctate por SSH al nodo worker de analítica:
   ```bash
   ssh -i "clave.pem" ubuntu@<IP_WORKER_ANALITICO>
   # Simular corte de servicio deteniendo el agente K3s:
   sudo systemctl stop k3s-agent
   ```
2. En la terminal del Master, ejecuta:
   ```bash
   kubectl get nodes
   ```
   Verás que el nodo pasa a estado **`NotReady`**.
3. Explica:
   > *"El controlador de nodos de Kubernetes detecta la pérdida de heartbeat. Si el nodo no se recupera, los pods se reprograman automáticamente en los nodos restantes disponibles que satisfagan las condiciones de scheduling."*
4. Reactivar el nodo:
   ```bash
   sudo systemctl start k3s-agent
   ```
   En segundos vuelve a estado **`Ready`**.

---

### 9.9. DEMO 9: Cheat Sheet de Emergencia y Rescate Rápido

Comandos indispensables para tener a la mano durante la sustentación ante cualquier imprevisto:

```bash
# 1. Ver el estado global de todo el namespace en una sola pantalla:
kubectl get all -n agropacayales-namespace

# 2. Diagnosticar por qué un pod no levanta o se queda en Error:
kubectl describe pod <NOMBRE_POD> -n agropacayales-namespace

# 3. Ver los últimos 30 eventos del clúster ordenados por hora:
kubectl get events -n agropacayales-namespace --sort-by='.metadata.creationTimestamp'

# 4. Entrar a la terminal interactiva dentro de un contenedor en ejecución:
kubectl exec -it deployment/backend-transaccional -n agropacayales-namespace -- sh

# 5. Reiniciar todos los microservicios del proyecto en 1 solo comando:
kubectl rollout restart deployment -n agropacayales-namespace

# 6. Eliminar y volver a aplicar todo el manifiesto desde cero:
kubectl apply -f k8s-manifests/agropacayales-k8s-all-in-one.yml
```

---

**Fin del Manual Maestro de Despliegue, Operación y Sustentación — AgroPacayales S.A.C.**
