# ☁️ Taller de Cloud Computing — AgroPacayales S.A.C.

Proyecto Web en AWS con **4 servicios diferentes**: **VPC, EC2, RDS y S3**.
Se levanta desde la **consola web de AWS** en **20–25 minutos**, con un solo user data para las 2 EC2.

> Despliegue distinto al de Kubernetes (`../despliegue-aws/`). Este es para el curso **Taller de Cloud Computing**.

## 📂 Archivos

| Archivo | Para qué |
| :-- | :-- |
| [`MANUAL_TALLER_CLOUD.md`](MANUAL_TALLER_CLOUD.md) | ✅ **Empieza aquí.** Checklist clic por clic |
| [`user-data-taller.sh`](user-data-taller.sh) | User data **único** para las 2 EC2. Se pega tal cual |
| `frontend-s3.tar.gz` | Frontend compilado. El user data le pone la IP de los backends y lo sube a S3 |
| `datos/` | Scripts que cargan los datos en SQL Server y MongoDB |

## 🏗️ Arquitectura

| Capa | Componente | Servicio AWS | Puerto |
| :-- | :-- | :-- | :-- |
| Frontend | React + TypeScript | **Amazon S3** (Static website hosting) | 80 |
| Backend 1 | Spring Boot WebFlux (Docker) | **Amazon EC2** `cc-backends` | 8081 |
| Backend 2 | Python + Flask + Pandas (Docker) | **Amazon EC2** `cc-backends` | 5000 |
| BD 1 | SQL Server (transaccional) | **Amazon RDS** | 1433 |
| BD 2 | MongoDB 8 (catálogos y eventos) | **Amazon EC2** `cc-mongodb` | 27017 |
| Red | VPC predeterminada + grupos de seguridad | **Amazon VPC** | — |

```
Navegador ──► Amazon S3 (Frontend) ──► EC2 cc-backends ──┬──► Amazon RDS  (SQL Server :1433)
                                        :8081 Backend 1   │
                                        :5000 Backend 2   └──► EC2 cc-mongodb (MongoDB :27017)
```

## 🐳 Imágenes (Docker Hub, solo para este taller)

| Imagen | Componente |
| :-- | :-- |
| `anafelixmendoza21/agropacayales-cc-backend:1.0` | Backend 1 (Spring Boot) |
| `anafelixmendoza21/agropacayales-cc-backend-analitico:1.0` | Backend 2 (Flask) |

> Distintas de las de Kubernetes (`agropacayales-backend:2.0`, etc.) para no confundirlas. El frontend no usa imagen: va como archivos en S3.
>
> Ya están publicadas: **no hay que construir nada para desplegar**. Para usar imágenes propias, ver [`../imagenes-docker/`](../imagenes-docker/README.md) y cambiar solo la línea `DOCKER_USER="..."` del user data.

## ✅ Rúbrica

| Criterio | Cumplimiento |
| :-- | :-- |
| 2 BD con 2 servicios diferentes | RDS + EC2 |
| 2 BE con mínimo 1 servicio | EC2 (Docker) |
| FE con un servicio diferente | S3 |
| Mínimo 4 servicios diferentes | VPC, EC2, RDS, S3 |
