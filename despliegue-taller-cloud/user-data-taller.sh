#!/bin/bash
# ==============================================================================
# AGROPACAYALES S.A.C. - USER DATA TALLER CLOUD COMPUTING (EL MISMO EN LAS 2 EC2)
# NO SE EDITA NADA. Cada EC2 decide qué instalar según su etiqueta "Name":
#   cc-mongodb  -> MongoDB 8 (BD 2)
#   cc-backends -> Backend 1 + Backend 2 en Docker, carga SQL Server (RDS) y
#                  publica el Frontend en Amazon S3 (sitio web estático)
# La IP de MongoDB y el endpoint de RDS se descubren solos con la API de AWS.
# Requisito: perfil de IAM "LabInstanceProfile" en las 2 EC2.
# Progreso: EC2 > Acciones > Supervisar y solucionar problemas > Obtener registro del sistema
# ==============================================================================
exec > >(tee -a /var/log/agropacayales.log) 2>&1

# ---------- Constantes del equipo (no tocar) ----------
MONGO_USER="admin"; MONGO_PASS="Mongo12345"; DB="agropacayales_db"
SQL_USER="admin"; SQL_PASS='AgroPacayales2026!'
DOCKER_USER="anafelixmendoza21"   # Docker Hub con las imágenes (cambiar SOLO si usas tus propias imágenes)
IMG_BACK1="$DOCKER_USER/agropacayales-cc-backend:1.0"
IMG_BACK2="$DOCKER_USER/agropacayales-cc-backend-analitico:1.0"
RAW="https://raw.githubusercontent.com/anafelix21/tcc/main/despliegue-taller-cloud"

log() { echo "[$(date +%H:%M:%S)] [AGRO] $*"; }
imds() {
  local t; t=$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 300')
  curl -s -H "X-aws-ec2-metadata-token: $t" "http://169.254.169.254/latest/meta-data/$1"
}
wait_port() { until nc -z -w 3 "$1" "$2"; do log "Esperando $1:$2 ..."; sleep 15; done; }

# ---------- Base común ----------
export DEBIAN_FRONTEND=noninteractive
echo 'DPkg::Lock::Timeout "600";' > /etc/apt/apt.conf.d/99agro-lock
apt-get update -y && apt-get install -y curl jq unzip netcat-openbsd gnupg
if ! command -v aws >/dev/null; then
  curl -sSL https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o /tmp/awscli.zip
  unzip -q /tmp/awscli.zip -d /tmp && /tmp/aws/install
fi
AWS_DEFAULT_REGION="$(imds placement/region)"; export AWS_DEFAULT_REGION
INSTANCE_ID="$(imds instance-id)"

until aws sts get-caller-identity >/dev/null 2>&1; do
  log "SIN PERMISOS AWS: asigna LabInstanceProfile (Acciones > Seguridad > Modificar rol de IAM). Reintentando..."
  sleep 20
done

NAME=$(aws ec2 describe-tags --filters "Name=resource-id,Values=$INSTANCE_ID" Name=key,Values=Name --query 'Tags[0].Value' --output text)
case "$(echo "$NAME" | tr '[:upper:]' '[:lower:]')" in
  *mongo*)   ROLE=mongodb ;;
  *backend*) ROLE=backends ;;
  *) log "ERROR: el nombre '$NAME' no corresponde a ningún rol (usa cc-mongodb o cc-backends)"; exit 1 ;;
esac
log "EC2 '$NAME' -> rol: $ROLE"

# ==============================================================================
# ROL: MONGODB 8.0 (EC2, puerto 27017)
# ==============================================================================
if [ "$ROLE" = mongodb ]; then
  curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg --batch --yes --dearmor -o /usr/share/keyrings/mongodb-server-8.0.gpg
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" > /etc/apt/sources.list.d/mongodb-org-8.0.list
  apt-get update -y && apt-get install -y mongodb-org
  mkdir -p /etc/systemd/system/mongod.service.d
  printf '[Service]\nEnvironment="GLIBC_TUNABLES=glibc.pthread.rseq=1"\n' > /etc/systemd/system/mongod.service.d/rseq.conf
  apt-mark hold linux-aws linux-image-aws linux-headers-aws
  systemctl disable --now unattended-upgrades || true
  systemctl daemon-reload && systemctl enable --now mongod
  until mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 3; done

  mongosh --quiet --eval "db.getSiblingDB('admin').createUser({user:'$MONGO_USER',pwd:'$MONGO_PASS',roles:['root']})"
  printf '\nsecurity:\n  authorization: enabled\n' >> /etc/mongod.conf
  systemctl restart mongod
  URI="mongodb://$MONGO_USER:$MONGO_PASS@localhost:27017/?authSource=admin"
  until mongosh "$URI" --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 3; done

  log "Poblando MongoDB (supplies, users, plots, field_records)..."
  curl -fsSL "$RAW/datos/init_mongodb_completo.js" -o /root/init_mongodb.js && mongosh "$URI" /root/init_mongodb.js

  # Recién ahora se abre a la red: si los backends ven el 27017, los datos ya están cargados
  sed -i 's/bindIp: 127.0.0.1/bindIp: 0.0.0.0/' /etc/mongod.conf
  systemctl restart mongod
  log "MONGODB LISTO Y POBLADO"
  aws ec2 modify-instance-metadata-options --instance-id "$INSTANCE_ID" --http-tokens required --http-put-response-hop-limit 1 >/dev/null 2>&1
  exit 0
fi

# ==============================================================================
# ROL: BACKENDS (Docker) + carga SQL Server (RDS) + Frontend en S3
# ==============================================================================
# Docker y cliente sqlcmd: se instalan mientras RDS todavía se está creando
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --batch --yes --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
curl -fsSL https://packages.microsoft.com/config/ubuntu/24.04/prod.list -o /etc/apt/sources.list.d/mssql-release.list
apt-get update -y && ACCEPT_EULA=Y apt-get install -y docker.io mssql-tools18 unixodbc
systemctl enable --now docker
for img in "$IMG_BACK1" "$IMG_BACK2"; do
  for i in 1 2 3 4 5; do docker pull "$img" && break; sleep 10; done
done
log "Docker listo e imágenes descargadas"

# 1) Descubrir MongoDB y RDS (sin escribir IPs a mano)
until MONGO_IP=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=cc-mongodb" Name=instance-state-name,Values=running \
        --query "Reservations[].Instances[].PrivateIpAddress" --output text | awk '{print $1}') && [ -n "$MONGO_IP" ]; do
  log "Buscando EC2 cc-mongodb..."; sleep 15
done
until RDS_HOST=$(aws rds describe-db-instances \
        --query "DBInstances[?starts_with(Engine,'sqlserver') && starts_with(DBInstanceIdentifier,'cc-') && Endpoint.Address] | [0].Endpoint.Address" --output text 2>/dev/null) \
      && [ -n "$RDS_HOST" ] && [ "$RDS_HOST" != None ]; do
  log "Esperando que RDS SQL Server termine de crearse (10-15 min)..."; sleep 30
done
log "MongoDB: $MONGO_IP | RDS: $RDS_HOST"
wait_port "$MONGO_IP" 27017
wait_port "$RDS_HOST" 1433

# 2) Crear y poblar la BD transaccional en RDS
sqlcmd() { /opt/mssql-tools18/bin/sqlcmd -C -S "$RDS_HOST,1433" -U "$SQL_USER" -P "$SQL_PASS" "$@"; }
curl -fsSL "$RAW/datos/init_sqlserver_completo.sql" -o /root/init_sqlserver.sql
for i in $(seq 60); do
  sqlcmd -b -i /root/init_sqlserver.sql && { log "SQL SERVER POBLADO"; break; }
  log "Reintento $i/60 de la carga SQL (si dice Login failed: RDS > Modify > Self managed + contraseña AgroPacayales2026!)"; sleep 20
done

# 3) Levantar los 2 backends en Docker (se reinician solos si la EC2 se reinicia)
MONGO_URI="mongodb://$MONGO_USER:$MONGO_PASS@$MONGO_IP:27017/$DB?authSource=admin"
docker network create agro-net 2>/dev/null || true
docker rm -f backend-analitico backend-transaccional 2>/dev/null || true
docker run -d --name backend-analitico --network agro-net --restart always -p 5000:5000 \
  -e SQL_SERVER="$RDS_HOST" -e SQL_PORT=1433 -e SQL_DATABASE="$DB" -e SQL_USER="$SQL_USER" -e SQL_PASSWORD="$SQL_PASS" \
  -e MONGO_URI="$MONGO_URI" -e MONGO_DATABASE="$DB" -e FLASK_ENV=production -e FLASK_DEBUG=False \
  "$IMG_BACK2"
docker run -d --name backend-transaccional --network agro-net --restart always -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=cloud -e SERVER_PORT=8081 \
  -e SQL_HOST="$RDS_HOST" -e SQL_PORT=1433 -e SQL_DATABASE="$DB" -e SQL_USERNAME="$SQL_USER" -e SQL_PASSWORD="$SQL_PASS" \
  -e MONGO_URI="$MONGO_URI" -e MONGO_URI_LOCAL="$MONGO_URI" -e MONGO_DATABASE="$DB" \
  -e ANALYTICS_URL=http://backend-analitico:5000 -e ANALYTICS_EVENTS_ENABLED=true -e SECURITY_ENFORCE=false \
  "$IMG_BACK1"
log "Backends levantados en Docker"

# 4) Frontend en Amazon S3. Queda como script para volver a publicarlo si cambia la IP pública
cat > /root/publicar-frontend-s3.sh <<EOF
#!/bin/bash
set -e
export AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION
T=\$(curl -s -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')
IP=\$(curl -s -H "X-aws-ec2-metadata-token: \$T" http://169.254.169.254/latest/meta-data/public-ipv4)
BKT=agropacayales-frontend-\$(aws sts get-caller-identity --query Account --output text)
if ! aws s3api head-bucket --bucket \$BKT 2>/dev/null; then
  if [ "\$AWS_DEFAULT_REGION" = us-east-1 ]; then aws s3api create-bucket --bucket \$BKT
  else aws s3api create-bucket --bucket \$BKT --create-bucket-configuration LocationConstraint=\$AWS_DEFAULT_REGION; fi
fi
aws s3api put-public-access-block --bucket \$BKT --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false
aws s3api put-bucket-policy --bucket \$BKT --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::\$BKT/*\"}]}"
aws s3 website s3://\$BKT --index-document index.html --error-document index.html
rm -rf /root/fe && mkdir -p /root/fe
curl -fsSL $RAW/frontend-s3.tar.gz | tar -xz -C /root/fe
grep -rl __AGRO_ /root/fe | xargs sed -i "s#__AGRO_API__#http://\$IP:8081/api#g; s#__AGRO_ANALYTICS__#http://\$IP:5000/api/v1/analytics#g"
aws s3 sync /root/fe s3://\$BKT --delete
cat > /home/ubuntu/URLS.txt <<EOT
==================== AGROPACAYALES - TALLER CLOUD COMPUTING ====================
Frontend (Amazon S3) .... http://\$BKT.s3-website-\$AWS_DEFAULT_REGION.amazonaws.com
Backend 1 Swagger ....... http://\$IP:8081/swagger-ui.html
Backend 1 OpenAPI ....... http://\$IP:8081/api-docs
Backend 2 Swagger ....... http://\$IP:5000/apidocs/
Backend 2 health ........ http://\$IP:5000/health
SQL Server (Amazon RDS) . $RDS_HOST,1433  (admin / $SQL_PASS)
MongoDB (Amazon EC2) .... $MONGO_IP:27017  (admin / $MONGO_PASS)
================================================================================
EOT
chown ubuntu:ubuntu /home/ubuntu/URLS.txt
cat /home/ubuntu/URLS.txt
EOF
chmod +x /root/publicar-frontend-s3.sh
for i in 1 2 3 4 5; do /root/publicar-frontend-s3.sh && { log "FRONTEND PUBLICADO EN S3"; break; }; sleep 15; done
# Si se reinicia el Learner Lab cambia la IP pública: se vuelve a publicar solo en cada arranque
echo "@reboot root sleep 60 && /root/publicar-frontend-s3.sh >> /var/log/agropacayales.log 2>&1" > /etc/cron.d/agro-frontend

# 5) Verificación automática
code() { curl -s -o /dev/null -m 10 -w '%{http_code}' "$1"; }
for i in $(seq 30); do [ "$(code http://localhost:8081/api/insumos)" = 200 ] && break; sleep 10; done
log "Chequeo HTTP: backend1-insumos=$(code http://localhost:8081/api/insumos) backend2-health=$(code http://localhost:5000/health)"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
# Seguridad: los contenedores ya no pueden leer el metadata (user data ni credenciales del rol)
aws ec2 modify-instance-metadata-options --instance-id "$INSTANCE_ID" --http-tokens required --http-put-response-hop-limit 1 >/dev/null 2>&1
log "DESPLIEGUE COMPLETO"
