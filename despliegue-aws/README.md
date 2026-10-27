# 🚀 Despliegue en AWS — AgroPacayales S.A.C.

Kubernetes (K3s) sobre EC2 con nodos dedicados + SQL Server en Amazon RDS + MongoDB en EC2.
Todo se levanta desde la **consola web de AWS** en **20–25 minutos**, sin SSH y sin editar IPs.

## 📂 Archivos

| Archivo | Para qué |
| :-- | :-- |
| [`MANUAL_RAPIDO.md`](MANUAL_RAPIDO.md) | ✅ **Empieza aquí.** Checklist clic por clic con la consola en inglés |
| [`MANUAL_DESPLIEGUE_USERDATA.md`](MANUAL_DESPLIEGUE_USERDATA.md) | Manual detallado: rúbrica, seguridad y solución de errores |
| [`user-data-universal.sh`](user-data-universal.sh) | User data **único** para las 5 EC2. Se pega tal cual, sin cambiar nada |

## 🏗️ Arquitectura

| Componente | Dónde corre | Puerto |
| :-- | :-- | :-- |
| Control plane K3s | EC2 `k8s-master` | 6443 (interno) |
| Frontend (React + nginx) | EC2 `k8s-node-frontend` | 30000 |
| Backend 1 (Spring Boot WebFlux) | EC2 `k8s-node-backend` | 30001 |
| Backend 2 Analítico (Python + Flask + Pandas) | EC2 `k8s-node-backendAnalitico` | 30002 |
| SQL Server (transaccional) | Amazon RDS `agropacayales-rds-sqlserver` | 1433 |
| MongoDB 8 (catálogos, eventos, analítica) | EC2 `ec2-mongodb` | 27017 |

```
Usuario ──► Frontend :30000 ──nginx──► Backend 1 :30001 ──eventos──► Backend 2 :30002
                                            │                            │
                                            ├──► SQL Server (RDS :1433) ◄─┤
                                            └──► MongoDB (EC2 :27017)  ◄──┘
```

## 🐳 Imágenes (Docker Hub)

| Imagen | Componente |
| :-- | :-- |
| `anafelixmendoza21/agropacayales-frontend:2.0` | Frontend |
| `anafelixmendoza21/agropacayales-backend:2.0` | Backend 1 |
| `anafelixmendoza21/agropacayales-backend-analitico:2.0` | Backend 2 |

Ya están publicadas: **no hay que construir nada para desplegar**. Para usar imágenes propias, ver [`../imagenes-docker/`](../imagenes-docker/README.md) y cambiar solo la línea `DOCKER_USER="..."` del user data.

## ⚡ Resumen del despliegue

1. Crear grupos de seguridad `evi-ec2-sg` y `evi-rds-sg`
2. Crear la RDS SQL Server (**Self managed**, no Secrets Manager)
3. Lanzar las 5 EC2 con `LabInstanceProfile` y el mismo user data
4. Esperar `DESPLIEGUE COMPLETO` en el system log de `k8s-master`
5. Abrir Frontend, Swagger del Backend 1 y del Backend 2

👉 Los pasos completos están en [`MANUAL_RAPIDO.md`](MANUAL_RAPIDO.md).
