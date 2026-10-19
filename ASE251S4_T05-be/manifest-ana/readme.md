# Despliegue en Kubernetes — Ana Felix #05

## 1. Verificar que Kubernetes esté activo (Docker Desktop / Minikube / Killercoda)

```powershell
kubectl config get-contexts
kubectl get nodes
```

## 2. Ir a la carpeta de manifiestos

```powershell
cd manifest-ana
dir
```
Confirma que estén los 5 archivos: `ana-felix-05-namespace.yml`, `ana-felix-05-secret.yml`, `ana-felix-05-configmap.yml`, `ana-felix-05-deployment.yml`, `ana-felix-05-service.yml`.

## 3. Aplicar los manifiestos (en este orden)

```powershell
kubectl apply -f ana-felix-05-namespace.yml
kubectl apply -f ana-felix-05-secret.yml
kubectl apply -f ana-felix-05-configmap.yml
kubectl apply -f ana-felix-05-deployment.yml
kubectl apply -f ana-felix-05-service.yml
```

## 4. Establecer el namespace por defecto (opcional)

```powershell
kubectl config set-context --current --namespace=ana-felix-05-namespace
```

## 5. Verificar el estado del despliegue

```powershell
kubectl get ns
kubectl get all,secrets,configmaps
kubectl get pods
```
Los pods deben estar en estado `Running` (2/2).

## 6. Probar la API (Port-Forward / Swagger)

```powershell
kubectl port-forward service/ana-felix-05-service 8081:30005
```
En otra terminal o navegador:
```powershell
curl http://localhost:8081/api/usuarios
```
O abre en tu navegador:
`http://localhost:8081/swagger-ui.html`

---

## 📹 7. Procedimiento para el Video de Evidencia (Validación de Dependencias)

El video debe demostrar cómo la aplicación requiere obligatoriamente del **Secret** (o ConfigMap) para iniciar correctamente sus pods.

### Paso A: Estado Normal (Con Secret)
1. Con todo desplegado correctamente, ejecuta:
   ```powershell
   kubectl get pods -n ana-felix-05-namespace
   ```
2. Muestra que los pods están en estado `Running`.

### Paso B: Eliminación de Secret y Redespliegue
1. Elimina el Secret del clúster:
   ```powershell
   kubectl delete -f ana-felix-05-secret.yml
   ```
2. Elimina y vuelve a aplicar el Deployment:
   ```powershell
   kubectl delete -f ana-felix-05-deployment.yml
   kubectl apply -f ana-felix-05-deployment.yml
   ```
3. Verifica el estado de los pods:
   ```powershell
   kubectl get pods -n ana-felix-05-namespace
   ```
4. **Resultado esperado:** Los pods NO podrán iniciarse y mostrarán un error como `CreateContainerConfigError` o `CreateContainerError` debido a la ausencia del Secret referenciado (`ana-felix-05-secret`).

### Paso C: Restauración del Secret
1. Vuelve a crear el Secret:
   ```powershell
   kubectl apply -f ana-felix-05-secret.yml
   ```
2. Revisa el estado de los pods:
   ```powershell
   kubectl get pods -n ana-felix-05-namespace -w
   ```
3. **Resultado esperado:** Kubernetes resolverá la dependencia y los pods cambiarán a estado `Running` exitosamente.

---

## 8. Limpieza del Entorno

```powershell
kubectl delete -f ana-felix-05-service.yml
kubectl delete -f ana-felix-05-deployment.yml
kubectl delete -f ana-felix-05-configmap.yml
kubectl delete -f ana-felix-05-secret.yml
kubectl delete -f ana-felix-05-namespace.yml
```
