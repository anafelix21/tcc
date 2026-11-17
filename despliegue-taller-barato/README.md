# ☁️ Taller de Cloud Computing — AgroPacayales S.A.C. (costo mínimo)

Proyecto web completo en AWS con **4 servicios** (**EC2, EBS, S3 y VPC**) y el **menor costo mensual**, desplegado con **un solo archivo de CloudFormation**.

**Equipo:** Ana Félix · Hugo Fernández · Axel Huapaya

| Archivo | Para qué |
| :-- | :-- |
| [`MANUAL_TALLER_BARATO.md`](MANUAL_TALLER_BARATO.md) | ✅ **Empieza aquí.** Paso a paso y evidencias para el video |
| [`taller-cloud-barato.yaml`](taller-cloud-barato.yaml) | Plantilla de CloudFormation (se sube tal cual) |
| [`scripts/instalar-todo.sh`](scripts/instalar-todo.sh) | Lo que instala la EC2 (lo descarga el user data de la plantilla) |
| [`COSTOS_CALCULADORA.md`](COSTOS_CALCULADORA.md) | Costo mensual, comparación de combinaciones y pasos de la calculadora de AWS |

## 🏗️ Arquitectura

| Capa | Componente | Servicio AWS |
| :-- | :-- | :-- |
| Frontend | React + TypeScript | **Amazon S3** (Static website hosting) |
| Backend 1 | Spring Boot WebFlux (Java) en Docker, puerto 8081 | **Amazon EC2** |
| Backend 2 | Python + Flask + Pandas en Docker, puerto 5000 | **Amazon EC2** |
| BD 1 | SQL Server 2022 **Express** (licencia gratuita) en Docker | **Amazon EC2** + **EBS** |
| BD 2 | MongoDB 7 en Docker | **Amazon EC2** + **EBS** |
| Red | VPC propia, grupo de seguridad e IP elástica | **Amazon VPC** |

```
Navegador ──► Amazon S3 (Frontend) ──► EC2 (IP elástica, VPC)
                                         ├─ Backend 1 Java :8081 ──┐
                                         ├─ Backend 2 Python :5000 ├─► SQL Server Express + MongoDB
                                         └─ (bases de datos internas, no publicadas)
```

## 💰 Costo estimado por mes (24/7, us-east-1)

| Combinación | US$ / mes |
| :-- | --: |
| Diseño anterior (2 EC2 + RDS SQL Server + S3) | ≥ 70 |
| Todo en una EC2 On-Demand + S3 | ≈ 32.4 |
| **Todo en una EC2 Spot + S3 (esta plantilla por defecto)** | **≈ 16.2** |

Detalle y cómo validarlo en la calculadora: [`COSTOS_CALCULADORA.md`](COSTOS_CALCULADORA.md).

## 🚀 Despliegue en 3 pasos

1. **CloudFormation → Create stack → Upload a template file →** `taller-cloud-barato.yaml` → nombre `taller` → **Submit**.
2. En la EC2 `taller-todo-en-uno` (Instance Connect): `tail -f /var/log/taller.log` hasta **`TALLER LISTO`**.
3. Abrir el **Frontend** (Output del stack) y los Swagger de los backends.

## 🐳 Imágenes (Docker Hub)

`anafelixmendoza21/agropacayales-cc-backend:1.0` · `anafelixmendoza21/agropacayales-cc-backend-analitico:1.0` · `mcr.microsoft.com/mssql/server:2022-latest` · `mongo:7.0`

> Los datos iniciales y el frontend compilado se toman de [`../despliegue-taller-cloud/`](../despliegue-taller-cloud/) (rama `main`).
