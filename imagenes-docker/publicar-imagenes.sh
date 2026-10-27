#!/bin/bash
# ==============================================================================
# AGROPACAYALES - Construye y publica en TU Docker Hub las imágenes de los 2 despliegues
#   Kubernetes (orquestadores): agropacayales-frontend / -backend / -backend-analitico :2.0
#   Taller Cloud Computing:     agropacayales-cc-backend / -cc-backend-analitico     :1.0
# Uso (Git Bash, Linux o Mac), desde la raíz del repo tcc:
#   bash imagenes-docker/publicar-imagenes.sh tu_usuario_dockerhub
# ==============================================================================
set -euo pipefail

DOCKER_USER="${1:-}"
if [ -z "$DOCKER_USER" ]; then
  read -rp "Usuario de Docker Hub: " DOCKER_USER
fi
[ -n "$DOCKER_USER" ] || { echo "[X] Falta el usuario de Docker Hub."; exit 1; }

cd "$(dirname "$0")/.."
docker info >/dev/null 2>&1 || { echo "[X] Docker no está corriendo. Abre Docker Desktop."; exit 1; }

echo "== 1/3 Iniciar sesión en Docker Hub como $DOCKER_USER"
docker login -u "$DOCKER_USER"

echo "== 2/3 Construir imágenes (linux/amd64, para EC2)"
docker build --platform linux/amd64 -t "$DOCKER_USER/agropacayales-frontend:2.0" ASE251S3_T05-fe
docker build --platform linux/amd64 -t "$DOCKER_USER/agropacayales-backend:2.0" ASE251S4_T05-be
docker build --platform linux/amd64 -t "$DOCKER_USER/agropacayales-backend-analitico:2.0" ASE251S4_T05-be-analitico
# El taller usa el mismo código de los backends con otro nombre (no se reconstruye)
docker tag "$DOCKER_USER/agropacayales-backend:2.0" "$DOCKER_USER/agropacayales-cc-backend:1.0"
docker tag "$DOCKER_USER/agropacayales-backend-analitico:2.0" "$DOCKER_USER/agropacayales-cc-backend-analitico:1.0"

echo "== 3/3 Subir a Docker Hub"
for img in agropacayales-frontend:2.0 agropacayales-backend:2.0 agropacayales-backend-analitico:2.0 \
           agropacayales-cc-backend:1.0 agropacayales-cc-backend-analitico:1.0; do
  docker push "$DOCKER_USER/$img"
done

cat <<EOF

==============================================================================
 LISTO. Imágenes publicadas en https://hub.docker.com/u/$DOCKER_USER
   $DOCKER_USER/agropacayales-frontend:2.0
   $DOCKER_USER/agropacayales-backend:2.0
   $DOCKER_USER/agropacayales-backend-analitico:2.0
   $DOCKER_USER/agropacayales-cc-backend:1.0
   $DOCKER_USER/agropacayales-cc-backend-analitico:1.0

 Para que el despliegue use TUS imágenes, cambia solo esta línea en el user data:
   DOCKER_USER="$DOCKER_USER"
   - Kubernetes: despliegue-aws/user-data-universal.sh
   - Taller:     despliegue-taller-cloud/user-data-taller.sh
 Y en Docker Hub deja los 5 repositorios como "Public".
==============================================================================
EOF
