# Despliegue en Kubernetes (Docker Desktop) — Axel Huapaya #10

## 1. Verificar que Kubernetes de Docker Desktop esté activo

```powershell
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl get nodes
```
Debes ver `desktop-control-plane` y `desktop-worker` en estado `Ready`.

## 2. Ir a la carpeta de manifiestos

```powershell
cd manifest-axel
dir
```
Confirma que estén los 5 archivos: `axel-huapaya-10-namespace.yml`, `axel-huapaya-10-secret.yml`, `axel-huapaya-10-configmap.yml`, `axel-huapaya-10-deployment.yml`, `axel-huapaya-10-service.yml`.

## 3. Aplicar los manifiestos (en este orden)

```powershell
kubectl apply -f axel-huapaya-10-namespace.yml
kubectl apply -f axel-huapaya-10-secret.yml
kubectl apply -f axel-huapaya-10-configmap.yml
kubectl apply -f axel-huapaya-10-deployment.yml
kubectl apply -f axel-huapaya-10-service.yml
```

## 4. Poner tu namespace como el de uso por defecto (opcional, cómodo)

```powershell
kubectl config set-context --current --namespace=axel-huapaya-10-namespace
```
A partir de aquí ya no necesitas escribir `-n axel-huapaya-10-namespace` en cada comando.

## 5. Verificar que todo esté corriendo

```powershell
kubectl get ns
kubectl get all,secrets,configmaps
kubectl get pods
```
Los pods deben quedar en `Running` (2/2). Si algo falla:
```powershell
kubectl describe pod <nombre-del-pod>
kubectl logs -f deployment/axel-huapaya-10-deployment
```

## 6. Probar la API

```powershell
kubectl port-forward service/axel-huapaya-10-service 8081:30001
```
En otra terminal, navegador o Swagger:
```powershell
curl http://localhost:8081/api/usuarios
```
o abre `http://localhost:8081/swagger-ui/index.html`. Debe devolver código 200 con tus datos reales de `agropacayales_db`.

## 7. Comandos útiles de mantenimiento

```powershell
# Reiniciar el deployment después de cambiar un Secret/ConfigMap
kubectl rollout restart deployment axel-huapaya-10-deployment

# Aplicar/eliminar un manifiesto puntual
kubectl apply -f axel-huapaya-10-secret.yml
kubectl delete -f axel-huapaya-10-secret.yml

# Ver el namespace actualmente en uso (Windows)
kubectl config view --minify | findstr namespace
```

## 8. Eliminar todo el despliegue cuando termines

```powershell
kubectl delete -f axel-huapaya-10-service.yml
kubectl delete -f axel-huapaya-10-deployment.yml
kubectl delete -f axel-huapaya-10-configmap.yml
kubectl delete -f axel-huapaya-10-secret.yml
kubectl delete -f axel-huapaya-10-namespace.yml
```
(Borrar el namespace también elimina automáticamente todo lo que esté dentro, así que basta con el último comando si quieres ir más rápido.)