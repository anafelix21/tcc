# 🐳 Imágenes Docker — AgroPacayales

Las imágenes **ya están publicadas** en el Docker Hub de Ana (`anafelixmendoza21`) y los dos user data las usan por defecto. **Para desplegar no hace falta construir nada**: solo seguir el manual.

| Imagen | Despliegue | Componente |
| :-- | :-- | :-- |
| `anafelixmendoza21/agropacayales-frontend:2.0` | Kubernetes | Frontend (React + nginx) |
| `anafelixmendoza21/agropacayales-backend:2.0` | Kubernetes | Backend 1 (Spring Boot) |
| `anafelixmendoza21/agropacayales-backend-analitico:2.0` | Kubernetes | Backend 2 (Flask) |
| `anafelixmendoza21/agropacayales-cc-backend:1.0` | Taller Cloud | Backend 1 |
| `anafelixmendoza21/agropacayales-cc-backend-analitico:1.0` | Taller Cloud | Backend 2 |

> El frontend del Taller no usa imagen: va como archivos en S3 (`despliegue-taller-cloud/frontend-s3.tar.gz`).

---

## ¿Quieres usar TUS propias imágenes? (Hugo, Axel o cualquiera)

### 1. Requisitos
- **Docker Desktop** abierto.
- Cuenta en **Docker Hub**.
- El repo `tcc` descargado (clonado o ZIP).

### 2. Construir y subir (un solo comando)
Desde la carpeta raíz del repo `tcc`:

**Windows (CMD o PowerShell)** — o doble clic en `publicar-imagenes.bat`:
```powershell
imagenes-docker\publicar-imagenes.bat tu_usuario
```
**Git Bash / Linux / Mac:**
```bash
bash imagenes-docker/publicar-imagenes.sh tu_usuario
```
El script: inicia sesión en Docker Hub (te pide tu contraseña o token), construye las 3 imágenes para `linux/amd64`, crea las 2 del taller con otro nombre y sube las 5. Tarda de 5 a 10 minutos.

### 3. Hacer públicas las imágenes
En https://hub.docker.com → cada repositorio `agropacayales-…` → **Settings → Visibility → Public**. Si quedan privadas, las EC2 no pueden descargarlas.

### 4. Usar tus imágenes en el despliegue
Cambia **solo esta línea** al inicio del user data (y nada más):
```bash
DOCKER_USER="tu_usuario"
```
- Kubernetes: [`despliegue-aws/user-data-universal.sh`](../despliegue-aws/user-data-universal.sh)
- Taller: [`despliegue-taller-cloud/user-data-taller.sh`](../despliegue-taller-cloud/user-data-taller.sh)

---

## Comprobar que una imagen funciona antes de desplegar
```bash
docker run --rm -d --name prueba-b2 -p 5000:5000 tu_usuario/agropacayales-backend-analitico:2.0
curl http://localhost:5000/health
docker rm -f prueba-b2
```
