# ☁️ INSTRUCTIVO DE IMPLEMENTACIÓN EN AWS — SPRINT 8
**Curso:** Taller Cloud Computing (TCC) — ASE251  
**Proyecto:** AgroPacayales (ASE251S4_T05)  
**Equipo:** #05 — Ana Félix Mendoza, Axel Huapaya, Hugo Fernández  

---

## 🎯 1. Matriz de Arquitectura y Componentes de la Solución

Basado en el estándar del curso y la arquitectura de microservicios políglota, la solución se compone de:

| Repositorio en Docker Hub | Rol en la Solución | Tecnología | Base de Datos Asociada |
| :--- | :--- | :--- | :--- |
| **`anafelixmendoza21/agropacayales-frontend:1.0`** | Frontend Web (Dashboard, Maestros, Cosechas, Actividades) | Angular 19 + TypeScript + Nginx | Consume APIs de ambos backends |
| **`anafelixmendoza21/agropacayales-backend:1.0`** | **Backend Transaccional (`backend-1`)** (CRUD, Transacciones y Reglas de Negocio) | Java 21 + Spring Boot WebFlux (Netty) | SQL Server 2022 (R2DBC) + MongoDB Atlas |
| **`anafelixmendoza21/agropacayales-backend-analitico:1.0`**| **Backend Analítico (`backend-2`)** (KPIs, Mermas, Rendimientos, Costos de Insumos) | Python 3.12 + Flask + Flasgger (OpenAPI) | SQL Server 2022 + MongoDB Atlas |
| **`mcr.microsoft.com/mssql/server:2022-latest`** | **BD Relacional** (Transacciones, Cosechas, Asignaciones, Cultivos) | Microsoft SQL Server 2022 (Puerto 1433) | Almacenamiento Relacional ACID |
| **`mongo:7.0` / MongoDB Atlas** | **BD NoSQL** (Maestros de Insumos, Parcelas, Usuarios) | MongoDB 7.0 (Puerto 27017 / Cloud Atlas) | Almacenamiento Documental JSON |

---

## 🌐 2. Diagrama de la Arquitectura en AWS (Mínimo 3 Servicios de AWS)

1. **Amazon EC2 (Servicio 1 - Cómputo):** Aloja Docker Engine con los 2 Backends y SQL Server.
2. **Amazon S3 (Servicio 2 - Almacenamiento & Hosting):** Aloja el Frontend Web Angular mediante **Static Website Hosting**.
3. **AWS VPC / Security Groups / CloudFront (Servicio 3 - Red y Distribución):** Enrutamiento seguro, firewall perimetral y entrega de contenidos.

```
                  ┌──────────────────────────────────────────────┐
                  │                 AWS CLOUD                    │
                  │                                              │
                  │   ┌──────────────────────────────────────┐   │
                  │   │      Amazon S3 (Web Hosting)         │   │
                  │   │   [Frontend Angular 19 SPA]          │   │
                  │   └──────────────────┬───────────────────┘   │
                  │                      │                       │
                  │                      ▼                       │
                  │   ┌──────────────────────────────────────┐   │
                  │   │        Amazon EC2 (Ubuntu)           │   │
                  │   │                                      │   │
                  │   │  ┌────────────────────────────────┐  │   │
                  │   │  │    Backend Transaccional       │  │   │
                  │   │  │   (Spring WebFlux - Port 8081) │  │   │
                  │   │  └───────────────┬────────────────┘  │   │
                  │   │                  │                   │   │
                  │   │  ┌───────────────▼────────────────┐  │   │
                  │   │  │      Backend Analítico         │  │   │
                  │   │  │    (Python Flask - Port 5000)  │  │   │
                  │   │  └───────────────┬────────────────┘  │   │
                  │   │                  │                   │   │
                  │   │  ┌───────────────▼────────────────┐  │   │
                  │   │  │    SQL Server 2022 (Docker)    │  │   │
                  │   │  │         (Port 1433)            │  │   │
                  │   │  └───────────────┬────────────────┘  │   │
                  │   └──────────────────┼───────────────────┘   │
                  │                      │                       │
                  └──────────────────────┼───────────────────────┘
                                         ▼
                     ┌──────────────────────────────────────┐
                     │ MongoDB Atlas (AWS us-east-1 NoSQL)  │
                     │ Colecciones: usuarios, insumos, etc. │
                     └──────────────────────────────────────┘
```

---

## 🛠️ 3. Paso a Paso: Despliegue en AWS

### PASO 1: Lanzamiento de la Instancia Amazon EC2
1. En la consola de AWS, ir a **EC2** > **Launch Instance**.
2. **Nombre:** `agropacayales-server-t05`
3. **AMI:** Ubuntu Server 24.04 LTS (x86_64).
4. **Tipo de instancia:** `t3.medium` (2 vCPU, 4 GiB RAM) o `t3.small`.
5. **Key Pair:** Seleccionar par de claves `.pem` existente.
6. **Security Group (Reglas de Entrada - Inbound Rules):**
   * **Puerto 22 (SSH):** Mi IP o `0.0.0.0/0`
   * **Puerto 80 (HTTP):** `0.0.0.0/0` (Frontend Nginx en EC2)
   * **Puerto 8081 (Custom TCP):** `0.0.0.0/0` (Backend Transaccional Java WebFlux)
   * **Puerto 5000 (Custom TCP):** `0.0.0.0/0` (Backend Analítico Python Flask)
   * **Puerto 1433 (Custom TCP):** `0.0.0.0/0` (SQL Server)
7. **Almacenamiento:** 25 GB gp3. Lanzar instancia y copiar la **IP Pública IPv4** (ej. `54.210.85.90`).

---

### PASO 2: Instalación de Docker y Puesta en Marcha en EC2
1. Conectarse por SSH a la instancia EC2 desde tu terminal:
   ```bash
   ssh -i "tu-clave.pem" ubuntu@<IP-PUBLICA-EC2>
   ```
2. Instalar Docker y Docker Compose (un solo comando):
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose git
   sudo systemctl enable --now docker
   sudo usermod -aG docker ubuntu
   newgrp docker
   ```
3. Clonar el repositorio unificado de GitHub y levantar la arquitectura:
   ```bash
   git clone https://github.com/anafelix21/tcc.git
   cd tcc
   docker compose -f docker-compose.aws.yml up -d
   ```
4. Verificar que los 4 contenedores estén corriendo (`Up`):
   ```bash
   docker ps
   ```
   Debes observar en ejecución:
   * `agropacayales-sqlserver` (Puerto `0.0.0.0:1433->1433/tcp`)
   * `agropacayales-backend-transaccional` (Puerto `0.0.0.0:8081->8081/tcp`)
   * `agropacayales-backend-analitico` (Puerto `0.0.0.0:5000->5000/tcp`)
   * `agropacayales-frontend-web` (Puerto `0.0.0.0:80->80/tcp`)

---

### PASO 3: Inicialización de Tablas en SQL Server 2022
Esperar unos 15 segundos a que SQL Server inicialice y ejecutar dentro de la carpeta `~/tcc`:
```bash
# 1. Crear base de datos
docker exec -i agropacayales-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'AgroPacayales2026!' -C -Q "CREATE DATABASE agropacayales_db;"

# 2. Inicializar tablas transaccionales (cultivos, cosechas, actividades)
cat ASE251S4_T05-be/src/main/resources/sql/init_transaccionales_sqlserver.sql | \
docker exec -i agropacayales-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'AgroPacayales2026!' -C -d agropacayales_db

# 3. Verificar que se crearon los registros
docker exec -i agropacayales-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'AgroPacayales2026!' -C -d agropacayales_db \
  -Q "SELECT id, nombre, variedad, area_hectareas FROM cultivos;"
```

---

### 🔑 Credenciales y Datos de Prueba para la Demo
* **Frontend Web:** `http://<IP-PUBLICA-EC2>`
  * **Usuario Admin 1:** `elena.flores@agropacayales.com` / `Pass123!`
  * **Usuario Admin 2:** `sofia.leon@agropacayales.com` / `Pass123!`
  * **Usuario Supervisor:** `jorge.torres@agropacayales.com` / `Pass123!`
* **Backend 1 - Transaccional (Spring Boot WebFlux):**
  * Swagger UI: `http://<IP-PUBLICA-EC2>:8081/swagger-ui.html`
  * Endpoint de prueba: `GET http://<IP-PUBLICA-EC2>:8081/api/usuarios`
* **Backend 2 - Analítico (Python Flask):**
  * Swagger UI (Flasgger): `http://<IP-PUBLICA-EC2>:5000/apidocs`
  * Endpoint KPIs: `GET http://<IP-PUBLICA-EC2>:5000/api/v1/analytics/dashboard/kpis`
  * Endpoint Cosechas: `GET http://<IP-PUBLICA-EC2>:5000/api/v1/analytics/cosechas/resumen`
* **Base de Datos 1 - MongoDB Atlas (NoSQL):**
  * Colecciones: `usuarios`, `insumos`, `parcelas`
* **Base de Datos 2 - SQL Server 2022 (Relacional):**
  * Servidor: `<IP-PUBLICA-EC2>,1433`
  * Usuario: `sa` | Contraseña: `AgroPacayales2026!` | Base de Datos: `agropacayales_db`


---

### PASO 4: Despliegue del Frontend en Amazon S3 (Static Website Hosting)

1. En el frontend ([environment.prod.ts](file:///c:/Users/anacr/OneDrive/Imágenes/Desktop/sprint8/tcc/ASE251S3_T05-fe/src/environments/environment.prod.ts)), colocar la IP de AWS:
   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'http://<IP-PUBLICA-EC2>:8081/api',
     analyticsApiUrl: 'http://<IP-PUBLICA-EC2>:5000/api/v1/analytics'
   };
   ```
2. Compilar el Frontend:
   ```bash
   cd ASE251S3_T05-fe
   npm run build -- --configuration production
   ```
3. En la consola de **Amazon S3**:
   * Crear bucket público: `agropacayales-frontend-t05`.
   * En **Properties** > activar **Static website hosting**:
     * Index document: `index.html`
     * Error document: `index.html` *(CRÍTICO para Angular SPA)*.
   * En **Permissions** > añadir política pública de lectura (`s3:GetObject`).
   * Subir los archivos generados en `dist/AgropacayalesWeb/browser/`.

---

## 📹 4. Guion para la Grabación del Video (1.0 pto)

**Requisito Obligatorio:** Cámara web activa del equipo encendida en todo momento.  
**Tiempo estimado:** 3 a 5 minutos.  

### 1. Introducción (15 segundos)
* Presentación del equipo #05.
* Mencionar los 3 servicios de AWS utilizados: **Amazon EC2**, **Amazon S3** y **AWS VPC / Security Groups**.

### 2. Las 2 Bases de Datos (60 segundos)
* **BD 1 (NoSQL - MongoDB Atlas):** Mostrar MongoDB Atlas en la nube con las colecciones `usuarios`, `insumos`, `parcelas` con documentos cargados.
* **BD 2 (Relacional - SQL Server 2022):** Mostrar en terminal o Azure Data Studio la conexión a `agropacayales_db` ejecutando consultas `SELECT * FROM cultivos;` y `SELECT * FROM harvest;`.

### 3. Los 2 Backends en AWS (60 segundos)
* Mostrar la terminal SSH conectada a EC2 con el comando `docker ps`, señalando:
  * Contenedor 1: `agropacayales-backend-transaccional` en puerto `8081`.
  * Contenedor 2: `agropacayales-backend-analitico` en puerto `5000`.
* Abrir en el navegador ambas documentaciones interactivas OpenAPI/Swagger:
  * **Swagger Backend Transaccional (Java WebFlux):**  
    `http://<IP-EC2>:8081/swagger-ui.html` -> Probar `GET /api/usuarios` o `/api/harvest/listar`.
  * **Swagger Backend Analítico (Python Flask):**  
    `http://<IP-EC2>:5000/apidocs` -> Probar `GET /api/v1/analytics/dashboard/kpis` y `/api/v1/analytics/cosechas/resumen`.

### 4. Frontend Web Funcionando (90 segundos)
* Abrir la URL pública de Amazon S3 (`http://agropacayales-frontend-t05.s3-website-us-east-1.amazonaws.com`).
* Iniciar sesión en vivo.
* Navegar por los módulos demostrando la interacción real con los backends y bases de datos.
* Recargar la página (F5) en una ruta interna para evidenciar que el hosting en S3 no da error 404.
