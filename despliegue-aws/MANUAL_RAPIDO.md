# Manual rápido clic por clic — AgroPacayales en AWS

Consola de AWS en **inglés**. Orden: **Grupos de seguridad → RDS → EC2**.
Tener abierto `user-data-universal.sh` para copiar (Ctrl+A, Ctrl+C).

---

## 1. Learner Lab ⏱ min 0

- [ ] **Start Lab** → esperar círculo verde → clic **AWS**
- [ ] Arriba a la derecha: **United States (N. Virginia)**

---

## 2. Grupo de seguridad `evi-ec2-sg` ⏱ min 1

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `evi-ec2-sg`
- [ ] Description: `evi-ec2-sg`
- [ ] VPC: dejar el que sale (default)

**Inbound rules**

- [ ] **Add rule** → Type: **Custom TCP** → Port range: `30000-30002` (en un solo campo) → Source type: **Anywhere-IPv4**
- [ ] **Add rule** → Type: **SSH** → Source type: **Anywhere-IPv4**
- [ ] **Add rule** → Type: **Custom TCP** → Port range: `27017` → Source type: **Anywhere-IPv4** (funciona desde cualquier red)
- [ ] Clic **Create security group**
- [ ] Copiar el ID que aparece arriba (ejemplo `sg-00ac74ff62ebece96`)

**Regla interna** (en el mismo grupo, recién creado)

- [ ] **Edit inbound rules** → **Add rule**
- [ ] Type: **All traffic** (baja en la lista)
- [ ] Source type: **Custom**
- [ ] Source: pegar el ID `sg-...` → **elegir de la lista** (no basta escribir el nombre)
- [ ] **Save rules**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| SSH | 22 | 0.0.0.0/0 |
| Custom TCP | 30000 - 30002 | 0.0.0.0/0 |
| Custom TCP | 27017 | 0.0.0.0/0 |
| All traffic | All | sg-... (evi-ec2-sg) |

---

## 3. Grupo de seguridad `evi-rds-sg` ⏱ min 3

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `evi-rds-sg`
- [ ] Description: `evi-rds-sg`
- [ ] VPC: default

**Inbound rules** (aquí **no** va All traffic)

- [ ] **Add rule** → Type: **MSSQL** → Source type: **Custom** → Source: pegar el ID `sg-...` de `evi-ec2-sg` → elegir de la lista
- [ ] **Add rule** → Type: **MSSQL** → Source type: **Anywhere-IPv4** (funciona desde cualquier red)
- [ ] **Create security group**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| MSSQL | 1433 | sg-... (evi-ec2-sg) |
| MSSQL | 1433 | 0.0.0.0/0 |

---

## 4. RDS SQL Server ⏱ min 4 (tarda 10–15 min en crearse, no esperar)

**Buscador de arriba: RDS → Databases → Create database**

- [ ] **Standard create**
- [ ] Engine type: **Microsoft SQL Server**
- [ ] Database management type: **Amazon RDS**
- [ ] Edition: **SQL Server Express Edition**
- [ ] Templates: **Free tier** (si no sale, **Dev/Test**)

**Settings**
- [ ] DB instance identifier: `agropacayales-rds-sqlserver`
- [ ] Master username: `admin`
- [ ] Credentials management: **Self managed** ⚠️ **NO** "Managed in AWS Secrets Manager" (si queda así, AWS inventa la contraseña y falla el `Login failed for user 'admin'`)
- [ ] Master password: `AgroPacayales2026!`
- [ ] Confirm master password: `AgroPacayales2026!`

**Instance configuration**
- [ ] DB instance class: **Burstable classes** → `db.t3.micro` (si no sale, `db.t3.small`)

**Storage**
- [ ] Storage type: **gp3** · Allocated storage: `20`
- [ ] Abrir **Additional storage configuration** → ☐ desmarcar **Enable storage autoscaling**

**Connectivity**
- [ ] Compute resource: **Don't connect to an EC2 compute resource**
- [ ] VPC: default
- [ ] Public access: **Yes** (para entrar con SSMS desde cualquier PC)
- [ ] VPC security group: **Choose existing** → agregar `evi-rds-sg` → quitar `default` (X)

**Monitoring** (si aparece)
- [ ] ☐ desmarcar **Performance Insights** / **Database Insights**
- [ ] ☐ desmarcar **Enhanced Monitoring**

**Additional configuration** (abajo, abrirlo)
- [ ] ☐ desmarcar **Enable automated backups**

- [ ] Clic **Create database** (si sale ventana de add-ons → **Close**)
- [ ] Estado: **Creating** → seguir al paso 5 sin esperar

---

## 5. EC2 `k8s-master` ⏱ min 7

**EC2 → Instances → Launch instances**

**Name and tags**
- [ ] Name: `k8s-master`

**Application and OS Images**
- [ ] **Ubuntu** → **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type**
- [ ] Architecture: **64-bit (x86)**

**Instance type**
- [ ] `t3.small`

**Key pair (login)**
- [ ] `vockey`

**Network settings → Edit**
- [ ] VPC: default
- [ ] Auto-assign public IP: **Enable**
- [ ] Firewall: **Select existing security group** → `evi-ec2-sg`

**Configure storage**
- [ ] `20` GiB · gp3

**Advanced details** (abrirlo, abajo)
- [ ] IAM instance profile: **LabInstanceProfile** ⚠️
- [ ] User data (al final): pegar **todo** `user-data-universal.sh`

- [ ] Clic **Launch instance** → **View all instances**

---

## 6. Las otras 4 EC2 ⏱ min 9–12

Repetir 4 veces:

- [ ] Marcar ☑ `k8s-master` → **Actions → Image and templates → Launch more like this**
- [ ] Name and tags → cambiar **Name**
- [ ] Instance type → cambiar tipo
- [ ] Configure storage → cambiar disco
- [ ] Advanced details → confirmar **LabInstanceProfile** y **User data** pegado
- [ ] **Launch instance**

| ✔ | Name (exacto) | Instance type | Storage |
| :-: | :-- | :-- | :-- |
| ☐ | `ec2-mongodb` | t3.small | 8 GiB |
| ☐ | `k8s-node-frontend` | t3.small | 20 GiB |
| ☐ | `k8s-node-backend` | **t3.medium** | 20 GiB |
| ☐ | `k8s-node-backendAnalitico` | t3.small | 20 GiB |

---

## 7. Revisar ⏱ min 13

**EC2 → Instances**

- [ ] 5 instancias en **Running**, nombres exactos
- [ ] Si alguna no tiene rol: marcarla → **Actions → Security → Modify IAM role** → `LabInstanceProfile` → **Update IAM role**

---

## 8. Esperar ⏱ min 13 → 22

- [ ] Marcar ☑ `k8s-master` → **Actions → Monitor and troubleshoot → Get system log**
- [ ] Buscar líneas `[AGRO]`. Cerrar y volver a abrir cada 1–2 min
- [ ] Orden esperado:
  1. `K3s server instalado`
  2. `Esperando que RDS SQL Server termine de crearse...` (se repite, es normal)
  3. `MongoDB: ... | RDS: ...`
  4. `SQL SERVER POBLADO`
  5. `Manifiestos aplicados...`
  6. `DESPLIEGUE TERMINADO` + URLs
  7. `DESPLIEGUE COMPLETO`

---

## 9. Abrir la app ⏱ min 22

**EC2 → Instances** → marcar cada EC2 → copiar **Public IPv4 address** (usar `http://`, no `https://`)

| ✔ | EC2 | URL |
| :-: | :-- | :-- |
| ☐ | `k8s-node-frontend` | `http://IP:30000` |
| ☐ | `k8s-node-backend` | `http://IP:30001/webjars/swagger-ui/index.html` |
| ☐ | `k8s-node-backend` | `http://IP:30001/api-docs` (importar en Postman) |
| ☐ | `k8s-node-backendAnalitico` | `http://IP:30002/apidocs/` |
| ☐ | `k8s-node-backendAnalitico` | `http://IP:30002/health` |

---

## 10. Entrar a las bases desde tu PC ⏱ min 23

**SQL Server Management Studio (SSMS)**
- [ ] **RDS → Databases →** `agropacayales-rds-sqlserver` → pestaña **Connectivity & security** → copiar **Endpoint**
- [ ] SSMS → **Connect to Server**:
  - Server type: **Database Engine**
  - Server name: `<Endpoint>,1433` (con coma)
  - Authentication: **SQL Server Authentication**
  - Login: `admin` · Password: `AgroPacayales2026!`
  - Encryption: **Mandatory** · ☑ **Trust server certificate**
- [ ] **Connect** → **Databases → agropacayales_db → Tables** → clic derecho → **Select Top 1000 Rows**

**MongoDB Compass**
- [ ] **EC2 → Instances** → ☑ `ec2-mongodb` → copiar **Public IPv4 address**
- [ ] Compass → **Add new connection** → URI (cambiar `IP_PUBLICA`):
```
mongodb://admin:Mongo12345@IP_PUBLICA:27017/agropacayales_db?authSource=admin
```
- [ ] **Save & Connect** → **agropacayales_db** → `supplies`, `users`, `plots`, `field_records`


---

## 11. Demo ⏱ min 24

- [ ] Marcar ☑ `k8s-master` → **Connect** → pestaña **EC2 Instance Connect** → **Connect**
- [ ] Copiar y pegar uno por uno:

```bash
cat ~/URLS.txt
```
```bash
kubectl get nodes -L role
```
```bash
kubectl get pods -n agropacayales-namespace -o wide
```
```bash
kubectl -n agropacayales-namespace exec deploy/backend-transaccional -- wget -qO- http://backend-analitico:5000/health
```
```bash
kubectl -n agropacayales-namespace exec deploy/backend-analitico -- curl -s localhost:5000/status/database
```
```bash
kubectl delete pod -l app=frontend -n agropacayales-namespace
```
```bash
kubectl get pods -n agropacayales-namespace -w
```
(Ctrl+C para salir del último)

---

## 12. Al terminar la presentación

- [ ] **EC2 → Security Groups** → `evi-ec2-sg` → **Edit inbound rules** → **Delete** en SSH 22 y en 27017 → **Save rules**
- [ ] `evi-rds-sg` → **Edit inbound rules** → **Delete** en la regla MSSQL **0.0.0.0/0** → **Save rules**
- [ ] **RDS → Modify** → Public access: **Not publicly accessible** → **Apply immediately**

---

## Comando único: revisar que todo esté conectado

- [ ] Marcar ☑ `k8s-master` → **Connect** → **EC2 Instance Connect** → **Connect**
- [ ] Copiar y pegar **todo** este comando (es una sola línea):

```bash
R=$(aws rds describe-db-instances --query "DBInstances[?starts_with(Engine,'sqlserver')]|[0].Endpoint.Address" --output text); echo "== RDS: $R"; nc -zv -w5 "$R" 1433 && sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -Q "SET NOCOUNT ON; SELECT COUNT(*) AS tablas FROM sys.tables; SELECT DISTINCT client_net_address AS ips_conectadas FROM sys.dm_exec_connections"; echo "== PODS"; kubectl get pods -n agropacayales-namespace -o wide; echo "== AVANCE"; sudo grep AGRO /var/log/agropacayales.log | tail -3
```

Cómo leer lo que sale:

| Sale | Significa |
| :-- | :-- |
| `== RDS: None` | La RDS aún se está creando: esperar y volver a pegarlo |
| `succeeded!` | El master llega a la RDS por la red ✅ |
| `tablas` con un número | Login OK y datos cargados ✅ |
| `ips_conectadas` con varias `172.31.x.x` | Los backends del clúster están conectados a la RDS ✅ |
| `Login failed` | La RDS quedó con Secrets Manager: **Modify → Self managed** |
| `Cannot open database` | Aún no termina la carga de datos: esperar |
| Pods `1/1 Running` | App levantada ✅ |
| Última línea `DESPLIEGUE COMPLETO` | Todo terminó ✅ |

---

## Si se traba

| Mensaje en el system log | Hacer |
| :-- | :-- |
| `SIN PERMISOS AWS` | Paso 7: **Modify IAM role** → `LabInstanceProfile` |
| `no corresponde a ningún rol` | **Instance state → Terminate** → relanzar con el nombre exacto |
| `Esperando ...:1433` | **RDS → Databases** → la BD → **Modify** → security group `evi-rds-sg` → **Apply immediately** |
| `Esperando ...:27017` o `:6443` | Paso 2, regla interna: **All traffic** · source `sg-...` de `evi-ec2-sg` |
| `Login failed for user 'admin'` / `Reintento X de la carga SQL` | Si en la RDS (Connectivity & security) aparece **Masters credentials ARN** de Secrets Manager: **Modify** → desmarcar *Manage master credentials in AWS Secrets Manager* (Self managed). Luego: **RDS → Modify** → New master password `AgroPacayales2026!` (escrita a mano) → **Continue → Apply immediately**. Si aún reintenta, se arregla solo. **No relanzar el master.** |
| Ya pasó `Reintento 10` | `k8s-master` → Connect → EC2 Instance Connect → `sudo /opt/mssql-tools18/bin/sqlcmd -C -S "<endpoint RDS>,1433" -U admin -P 'AgroPacayales2026!' -b -i /root/init_sqlserver.sql` → luego `kubectl -n agropacayales-namespace rollout restart deploy/backend-transaccional deploy/backend-analitico` |
| Error rojo "CIDR block, a security group ID..." | En Source escribiste el nombre: quitar la etiqueta y elegir el `sg-...` de la lista |
| SSMS: *timeout* / *network-related error* | RDS no está **Available**, Public access no es **Yes**, o falta MSSQL **Anywhere-IPv4** en `evi-rds-sg` |
| SSMS: *certificate chain not trusted* | ☑ **Trust server certificate** |
| Compass: *connection timed out* | Falta 27017 **Anywhere-IPv4** en `evi-ec2-sg`, o IP de `ec2-mongodb` mal copiada |
| Compass: *Authentication failed* | La URI debe terminar en `?authSource=admin` |
