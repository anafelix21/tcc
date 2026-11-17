#!/bin/bash
# =============================================================================
# Taller Cloud Computing - AgroPacayales: TODO EN UNA SOLA EC2 (el costo minimo)
#   SQL Server 2022 Express + MongoDB 7 + Backend 1 (Java) + Backend 2 (Python)
#   en Docker. El Frontend se publica en Amazon S3.
# Lo descarga y ejecuta el user data de taller-cloud-barato.yaml
# Variables: BUCKET (bucket S3 del frontend), PUBLIC_IP (IP elastica), DOCKER_USER
# Log: /var/log/taller.log
# =============================================================================
exec > >(tee -a /var/log/taller.log) 2>&1
: "${BUCKET:?falta BUCKET}" "${PUBLIC_IP:?falta PUBLIC_IP}"
DOCKER_USER="${DOCKER_USER:-anafelixmendoza21}"
RAW="https://raw.githubusercontent.com/anafelix21/tcc/develop/despliegue-taller-barato"   # datos/ y frontend-s3.tar.gz estan en esta misma carpeta
SQL_PASS='AgroPacayales2026!'
MONGO_USER=admin; MONGO_PASS=Mongo12345; DB=agropacayales_db
IMG_SQL=mcr.microsoft.com/mssql/server:2022-latest
IMG_MONGO=mongo:7.0
IMG_BACK1="$DOCKER_USER/agropacayales-cc-backend:1.0"
IMG_BACK2="$DOCKER_USER/agropacayales-cc-backend-analitico:1.0"
log() { echo "[$(date +%H:%M:%S)] [TALLER] $*"; }
export DEBIAN_FRONTEND=noninteractive
echo 'DPkg::Lock::Timeout "600";' > /etc/apt/apt.conf.d/99taller-lock

# ---------- Swap de 2 GB: la EC2 de 4 GB aguanta los 4 contenedores sin quedarse sin memoria
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# ---------- Descargas en PARALELO con la instalacion de Docker
mkdir -p /root/datos
curl -fsSL --retry 5 "$RAW/datos/init_sqlserver_completo.sql" -o /root/datos/init_sqlserver.sql & P1=$!
curl -fsSL --retry 5 "$RAW/datos/init_mongodb_completo.js" -o /root/datos/init_mongodb.js & P2=$!
curl -fsSL --retry 5 "$RAW/frontend-s3.tar.gz" -o /root/datos/frontend-s3.tar.gz & P3=$!
curl -fsSL --retry 5 https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscli.zip & P4=$!
apt-get update -y && apt-get install -y --no-install-recommends docker.io unzip curl
systemctl enable --now docker
# Solo se espera a estas 4 descargas (un wait sin PIDs se cuelga por el tee del log)
wait $P1 $P2 $P3 $P4
unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install >/dev/null
T=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
export AWS_DEFAULT_REGION="$(curl -s -H "X-aws-ec2-metadata-token: $T" http://169.254.169.254/latest/meta-data/placement/region)"
log "Docker, AWS CLI y archivos de datos listos"

# ---------- Imagenes de los 4 contenedores en paralelo
PIDS=()
for img in "$IMG_SQL" "$IMG_MONGO" "$IMG_BACK1" "$IMG_BACK2"; do
  ( for i in 1 2 3 4 5; do docker pull -q "$img" >/dev/null && exit 0; sleep 10; done; exit 1 ) & PIDS+=($!)
done
wait "${PIDS[@]}"
log "Imagenes descargadas"

# ---------- Bases de datos (no se publican al exterior: solo las ven los backends)
docker network create agro-net 2>/dev/null || true
# SQL Server Express (licencia gratuita). Sin --memory: SQL Server exige 2 GB visibles; se limita con MSSQL_MEMORY_LIMIT_MB
docker run -d --name mssql --network agro-net --restart always \
  -e ACCEPT_EULA=Y -e MSSQL_PID=Express -e MSSQL_SA_PASSWORD="$SQL_PASS" -e MSSQL_MEMORY_LIMIT_MB=1100 \
  -v mssql-data:/var/opt/mssql "$IMG_SQL"
docker run -d --name mongo --network agro-net --restart always \
  -e MONGO_INITDB_ROOT_USERNAME="$MONGO_USER" -e MONGO_INITDB_ROOT_PASSWORD="$MONGO_PASS" \
  -v mongo-data:/data/db "$IMG_MONGO" --wiredTigerCacheSizeGB 0.25

# ---------- Cargar los datos
SQLCMD=""
until SQLCMD=$(docker exec mssql bash -c 'ls /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd 2>/dev/null | head -1') && [ -n "$SQLCMD" ] \
      && docker exec mssql "$SQLCMD" -C -S localhost -U sa -P "$SQL_PASS" -Q "SELECT 1" >/dev/null 2>&1; do
  log "Esperando a SQL Server..."; sleep 5
done
docker cp /root/datos/init_sqlserver.sql mssql:/tmp/init.sql
docker exec mssql "$SQLCMD" -C -S localhost -U sa -P "$SQL_PASS" -b -i /tmp/init.sql && log "SQL SERVER POBLADO"

MURI="mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/?authSource=admin"
until docker exec mongo mongosh "$MURI" --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do log "Esperando a MongoDB..."; sleep 3; done
docker cp /root/datos/init_mongodb.js mongo:/tmp/init.js
docker exec mongo mongosh "$MURI" --quiet --file /tmp/init.js >/dev/null && log "MONGODB POBLADO"

# ---------- Backends (memoria acotada para convivir en la misma EC2)
MONGO_URI="mongodb://$MONGO_USER:$MONGO_PASS@mongo:27017/$DB?authSource=admin"
docker run -d --name backend-analitico --network agro-net --restart always -p 5000:5000 \
  -e SQL_SERVER=mssql -e SQL_PORT=1433 -e SQL_DATABASE="$DB" -e SQL_USER=sa -e SQL_PASSWORD="$SQL_PASS" \
  -e MONGO_URI="$MONGO_URI" -e MONGO_DATABASE="$DB" -e FLASK_ENV=production -e FLASK_DEBUG=False \
  "$IMG_BACK2" gunicorn -w 1 --threads 4 --timeout 60 -b 0.0.0.0:5000 wsgi:app
docker run -d --name backend-transaccional --network agro-net --restart always -p 8081:8081 \
  -e JAVA_TOOL_OPTIONS="-Xms128m -Xmx320m -XX:+UseSerialGC" \
  -e SPRING_PROFILES_ACTIVE=cloud -e SERVER_PORT=8081 \
  -e SQL_HOST=mssql -e SQL_PORT=1433 -e SQL_DATABASE="$DB" -e SQL_USERNAME=sa -e SQL_PASSWORD="$SQL_PASS" \
  -e MONGO_URI="$MONGO_URI" -e MONGO_URI_LOCAL="$MONGO_URI" -e MONGO_DATABASE="$DB" \
  -e ANALYTICS_URL=http://backend-analitico:5000 -e ANALYTICS_EVENTS_ENABLED=true -e SECURITY_ENFORCE=false \
  "$IMG_BACK1"
log "Backends iniciados"

# ---------- Frontend en Amazon S3 (apunta a la IP elastica de esta EC2)
mkdir -p /root/fe && tar -xzf /root/datos/frontend-s3.tar.gz -C /root/fe
grep -rl __AGRO_ /root/fe | xargs sed -i "s#__AGRO_API__#http://$PUBLIC_IP:8081/api#g; s#__AGRO_ANALYTICS__#http://$PUBLIC_IP:5000/api/v1/analytics#g"
for i in 1 2 3 4 5; do aws s3 sync /root/fe "s3://$BUCKET" --delete --only-show-errors && break; sleep 10; done
log "FRONTEND PUBLICADO EN S3"

# ---------- Verificacion y resumen
code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1"; }
for i in $(seq 40); do [ "$(code http://localhost:8081/api/insumos)" = 200 ] && break; sleep 8; done
cat > /home/ubuntu/URLS.txt <<EOT
==================== AGROPACAYALES - TALLER CLOUD (COSTO MINIMO) ====================
Frontend (Amazon S3) .... http://$BUCKET.s3-website-$AWS_DEFAULT_REGION.amazonaws.com
Backend 1 Swagger ....... http://$PUBLIC_IP:8081/swagger-ui.html
Backend 2 Swagger ....... http://$PUBLIC_IP:5000/apidocs/
Backend 2 health ........ http://$PUBLIC_IP:5000/health
Chequeo: backend1-insumos=$(code http://localhost:8081/api/insumos)  backend2-health=$(code http://localhost:5000/health)
=====================================================================================
EOT
chown ubuntu:ubuntu /home/ubuntu/URLS.txt
cat /home/ubuntu/URLS.txt; docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'; free -m | head -2
log "TALLER LISTO"
