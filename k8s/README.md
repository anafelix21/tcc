# ☸️ Despliegue en Kubernetes (EKS / EC2) — Orquestadores y Automatización

Este directorio contiene los manifiestos oficiales de Kubernetes para cumplir al 100% con la rúbrica del curso **Orquestadores y Automatización de Software (3.5 pts)**.

---

## 🏗️ 1. Arquitectura y Aislamiento de Nodos Dedicados (1.0 pto)

El clúster distribuye de manera independiente los microservicios en **3 grupos de nodos EC2 dedicados**:

| Componente | Imagen Docker | Nodo EC2 Dedicado (Etiqueta) | Puerto |
|---|---|---|---|
| **Frontend Web** | `anafelixmendoza21/agropacayales-frontend:1.0` | `role=frontend-node` | 80 |
| **Backend 1 (Spring WebFlux)** | `anafelixmendoza21/agropacayales-backend:1.0` | `role=backend-node` | 8081 |
| **Backend 2 Analítico (Flask)** | `anafelixmendoza21/agropacayales-backend-analitico:1.0` | `role=analytics-node` | 5000 |

### Etiquetar los nodos de trabajo (Worker Nodes) en Kubernetes:
```bash
kubectl label nodes <nodo-ec2-1> role=frontend-node
kubectl label nodes <nodo-ec2-2> role=backend-node
kubectl label nodes <nodo-ec2-3> role=analytics-node
```

---

## 🔄 2. Conectividad Interna y Procesamiento de Eventos/Logs (1.0 pto)

- **Backend 1 ↔ Backend 2:** El Backend 1 envía eventos de negocio e ingesta de logs en tiempo real mediante HTTP interno a `http://backend-analitico-svc.agropacayales.svc.cluster.local:5000/api/v1/analytics/eventos`.
- **Seguridad y Auditoría:** Configurado mediante `security/AuthWebFilter` (JWT con clave en `agropacayales-secrets`) y filtro de eventos `events/EventoNegocioWebFilter`.

---

## 🌐 3. Rutas de Red y Persistencia Políglota Externa (1.0 pto)

El archivo `02-external-databases.yaml` define:
1. **Servicio `sqlserver-rds` (tipo `ExternalName`):** Enruta el puerto `1433` hacia Amazon RDS SQL Server 2022.
2. **Servicio `mongodb-atlas` (tipo `ExternalName`):** Enruta el puerto `27017` hacia MongoDB Atlas / EC2.
3. **`NetworkPolicy` (`permitir-conectividad-interna-y-bd`):** Restringe el tráfico permitiendo únicamente:
   - Comunicación interna entre los pods del namespace `agropacayales`.
   - Salida segura a los puertos `1433` (RDS) y `27017` (MongoDB).

---

## 📖 4. Endpoints y Documentación Swagger OpenAPI (0.5 pto)

Ambos microservicios exponen su documentación OpenAPI interactiva:
- **Backend 1:** `http://<INGRESS-HOST>/swagger-ui.html`
- **Backend 2:** `http://<INGRESS-HOST>/apidocs`

---

## 🚀 5. Cómo aplicar los manifiestos en el clúster

```bash
# 1. Crear namespace
kubectl apply -f k8s/00-namespace.yaml

# 2. Variables de entorno, secretos y persistencia políglota externa
kubectl apply -f k8s/01-configmaps-secrets.yaml
kubectl apply -f k8s/02-external-databases.yaml

# 3. Desplegar los 3 microservicios en sus nodos dedicados
kubectl apply -f k8s/03-backend1-deployment.yaml
kubectl apply -f k8s/04-backend2-deployment.yaml
kubectl apply -f k8s/05-frontend-deployment.yaml

# 4. Habilitar Ingress público
kubectl apply -f k8s/06-ingress.yaml

# 5. Comprobar que los pods están distribuidos en los nodos correspondientes
kubectl get pods -n agropacayales -o wide
```
