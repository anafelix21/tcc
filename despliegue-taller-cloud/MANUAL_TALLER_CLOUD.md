# Manual clic por clic — Taller de Cloud Computing (AgroPacayales)

Proyecto Web en AWS con **4 servicios diferentes**: **VPC + EC2 + RDS + S3**.
Consola de AWS en **inglés**. Orden: **Grupos de seguridad → RDS → EC2**. ⏱ Total: 20–25 min.
Tener abierto `user-data-taller.sh` para copiar (Ctrl+A, Ctrl+C).

| Rúbrica | Cómo se cumple |
| :-- | :-- |
| 2 BD con 2 servicios diferentes | SQL Server en **Amazon RDS** + MongoDB en **Amazon EC2** |
| 2 BE con mínimo 1 servicio | Backend 1 (Spring Boot) + Backend 2 (Flask) en Docker sobre **Amazon EC2** |
| FE con 1 servicio diferente | Frontend en **Amazon S3** (Static website hosting) |
| Mínimo 4 servicios diferentes | **Amazon VPC** (red y grupos de seguridad), **EC2**, **RDS**, **S3** (+ IAM `LabInstanceProfile`) |

```
Navegador ──► Amazon S3 (Frontend) ──► EC2 cc-backends ──┬──► Amazon RDS  (SQL Server :1433)
                                        :8081 Backend 1   │
                                        :5000 Backend 2   └──► EC2 cc-mongodb (MongoDB :27017)
                      (todo dentro de la VPC predeterminada, protegido por grupos de seguridad)
```

---

## 1. Learner Lab ⏱ min 0

- [ ] **Start Lab** → esperar círculo verde → clic **AWS**
- [ ] Arriba a la derecha: **United States (N. Virginia)**

---

## 2. Grupo de seguridad `cc-ec2-sg` ⏱ min 1

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `cc-ec2-sg`
- [ ] Description: `cc-ec2-sg`
- [ ] VPC: dejar el que sale (default)

**Inbound rules**

- [ ] **Add rule** → Type: **Custom TCP** → Port range: `8081` → Source type: **Anywhere-IPv4**
- [ ] **Add rule** → Type: **Custom TCP** → Port range: `5000` → Source type: **Anywhere-IPv4**
- [ ] **Add rule** → Type: **SSH** → Source type: **Anywhere-IPv4**
- [ ] **Add rule** → Type: **Custom TCP** → Port range: `27017` → Source type: **Anywhere-IPv4** (MongoDB Compass)
- [ ] Clic **Create security group**
- [ ] Copiar el ID que aparece arriba (ejemplo `sg-0abc123...`)

**Regla interna** (en el mismo grupo, recién creado)

- [ ] **Edit inbound rules** → **Add rule**
- [ ] Type: **All traffic**
- [ ] Source type: **Custom** → Source: pegar el ID `sg-...` → **elegir de la lista**
- [ ] **Save rules**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| Custom TCP | 8081 | 0.0.0.0/0 |
| Custom TCP | 5000 | 0.0.0.0/0 |
| SSH | 22 | 0.0.0.0/0 |
| Custom TCP | 27017 | 0.0.0.0/0 |
| All traffic | All | sg-... (cc-ec2-sg) |

---

## 3. Grupo de seguridad `cc-rds-sg` ⏱ min 3

**EC2 → Security Groups → Create security group**

- [ ] Security group name: `cc-rds-sg`
- [ ] Description: `cc-rds-sg`
- [ ] VPC: default

**Inbound rules** (aquí **no** va All traffic)

- [ ] **Add rule** → Type: **MSSQL** → Source type: **Custom** → Source: pegar el ID `sg-...` de `cc-ec2-sg` → elegir de la lista
- [ ] **Add rule** → Type: **MSSQL** → Source type: **Anywhere-IPv4** (SQL Server Management Studio)
- [ ] **Create security group**

Debe quedar:

| Type | Port range | Source |
| :-- | :-- | :-- |
| MSSQL | 1433 | sg-... (cc-ec2-sg) |
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
- [ ] DB instance identifier: `cc-taller-rds-sqlserver`
- [ ] Master username: `admin`
- [ ] Credentials management: **Self managed** ⚠️ **NO** "Managed in AWS Secrets Manager" (si no, sale `Login failed for user 'admin'`)
- [ ] Master password: `AgroPacayales2026!`
- [ ] Confirm master password: `AgroPacayales2026!`

**Instance configuration**
- [ ] DB instance class: **Burstable classes** → `db.t3.micro` (si no sale, `db.t3.small`)

**Storage**
- [ ] Storage type: **gp3** · Allocated storage: `20`
- [ ] **Additional storage configuration** → ☐ desmarcar **Enable storage autoscaling**

**Connectivity**
- [ ] Compute resource: **Don't connect to an EC2 compute resource**
- [ ] VPC: default
- [ ] Public access: **Yes** (para entrar con SSMS)
- [ ] VPC security group: **Choose existing** → agregar `cc-rds-sg` → quitar `default` (X)

**Monitoring**
- [ ] Dejar **Database Insights – Standard**
- [ ] ☐ desmarcar **Collect detailed database and per-query metrics**
- [ ] **Additional monitoring settings** → ☐ **Enable Enhanced monitoring** · ☐ nada en **Log exports**

**Additional configuration** (abajo, abrirlo)
- [ ] ☐ desmarcar **Enable automated backups**

- [ ] Clic **Create database** (si sale ventana de add-ons → **Close**)
- [ ] Estado: **Creating** → seguir al paso 5 sin esperar

---

## 5. EC2 `cc-mongodb` ⏱ min 7

**EC2 → Instances → Launch instances**

- [ ] Name: `cc-mongodb`
- [ ] AMI: **Ubuntu** → **Ubuntu Server 24.04 LTS (HVM), SSD Volume Type** · **64-bit (x86)**
- [ ] Instance type: `t3.small`
- [ ] Key pair: `vockey`
- [ ] **Network settings → Edit** → Auto-assign public IP: **Enable** → **Select existing security group** → `cc-ec2-sg`
- [ ] Configure storage: `8` GiB · gp3
- [ ] **Advanced details** → IAM instance profile: **LabInstanceProfile** ⚠️
- [ ] **Advanced details** → User data: pegar **todo** `user-data-taller.sh`
- [ ] **Launch instance** → **View all instances**

---

## 6. EC2 `cc-backends` ⏱ min 9

- [ ] Marcar ☑ `cc-mongodb` → **Actions → Image and templates → Launch more like this**
- [ ] Name: `cc-backends`
- [ ] Instance type: **`t3.medium`** (2 backends necesitan más RAM)
- [ ] Configure storage: `20` GiB
- [ ] Advanced details → confirmar **LabInstanceProfile** y **User data** pegado
- [ ] **Launch instance**

Debe quedar en **EC2 → Instances**:

| Name (exacto) | Instance type | Storage | Qué instala solo |
| :-- | :-- | :-- | :-- |
| `cc-mongodb` | t3.small | 8 GiB | MongoDB 8 + datos (BD 2) |
| `cc-backends` | t3.medium | 20 GiB | Docker + Backend 1 + Backend 2, carga SQL Server y publica el Frontend en S3 |

- [ ] Si alguna no tiene rol: marcarla → **Actions → Security → Modify IAM role** → `LabInstanceProfile` → **Update IAM role**

---

## 7. Esperar ⏱ min 10 → 20

- [ ] Marcar ☑ `cc-backends` → **Actions → Monitor and troubleshoot → Get system log**
- [ ] Buscar líneas `[AGRO]`. Cerrar y volver a abrir cada 1–2 min

| # | Mensaje | Significa |
| :-: | :-- | :-- |
| 1 | `Docker listo e imágenes descargadas` | Backends listos para arrancar |
| 2 | `Esperando que RDS SQL Server termine de crearse...` | Normal: se repite hasta que la RDS esté lista |
| 3 | `MongoDB: 172.31.x.x \| RDS: cc-taller-rds-sqlserver...` | Encontró las 2 bases de datos |
| 4 | `SQL SERVER POBLADO` | Tablas y +800 registros en RDS |
| 5 | `Backends levantados en Docker` | Backend 1 y Backend 2 corriendo |
| 6 | `FRONTEND PUBLICADO EN S3` + URLs | Frontend en el bucket S3 |
| 7 | `Chequeo HTTP: backend1-insumos=200 backend2-health=200` | Todo responde ✅ |
| 8 | `DESPLIEGUE COMPLETO` | Fin |

---

## 8. Abrir la app ⏱ min 20

- [ ] **EC2 → Instances** → ☑ `cc-backends` → copiar **Public IPv4 address**
- [ ] **S3 → Buckets** → `agropacayales-frontend-<número>` → pestaña **Properties** → abajo **Static website hosting** → copiar **Bucket website endpoint**

| ✔ | Qué | URL |
| :-: | :-- | :-- |
| ☐ | Frontend (S3) | `http://agropacayales-frontend-<número>.s3-website-us-east-1.amazonaws.com` |
| ☐ | Backend 1 Swagger | `http://IP:8081/swagger-ui.html` |
| ☐ | Backend 1 OpenAPI (Postman) | `http://IP:8081/api-docs` |
| ☐ | Backend 2 Swagger | `http://IP:5000/apidocs/` |
| ☐ | Backend 2 health | `http://IP:5000/health` |

> Usar `http://`, no `https://`.

---

## 9. Mostrar los 4 servicios al docente

| ✔ | Servicio | Dónde mostrarlo en la consola |
| :-: | :-- | :-- |
| ☐ | **Amazon VPC** | **VPC → Your VPCs** (default) y **EC2 → Security Groups** → `cc-ec2-sg`, `cc-rds-sg` |
| ☐ | **Amazon EC2** | **EC2 → Instances** → `cc-mongodb` (BD 2) y `cc-backends` (BE 1 y BE 2) |
| ☐ | **Amazon RDS** | **RDS → Databases** → `cc-taller-rds-sqlserver` (BD 1, Available) |
| ☐ | **Amazon S3** | **S3 → Buckets** → `agropacayales-frontend-...` → **Objects** (index.html, assets) y **Properties → Static website hosting** |

---

## 10. Entrar a las bases desde tu PC

**SQL Server Management Studio (SSMS)**
- [ ] **RDS → Databases →** `cc-taller-rds-sqlserver` → **Connectivity & security** → copiar **Endpoint**
- [ ] SSMS → **Connect to Server**:
  - Server name: `<Endpoint>,1433` (con coma)
  - Authentication: **SQL Server Authentication**
  - Login: `admin` · Password: `AgroPacayales2026!`
  - Encryption: **Mandatory** · ☑ **Trust server certificate**
- [ ] **Connect** → **Databases → agropacayales_db → Tables**

**MongoDB Compass**
- [ ] **EC2 → Instances** → ☑ `cc-mongodb` → copiar **Public IPv4 address**
- [ ] Compass → **Add new connection** → URI (cambiar `IP_PUBLICA`):
```
mongodb://admin:Mongo12345@IP_PUBLICA:27017/agropacayales_db?authSource=admin
```
- [ ] **Save & Connect** → **agropacayales_db** → `supplies`, `users`, `plots`, `field_records`

---

## 11. Comando único: revisar que todo esté conectado

- [ ] Marcar ☑ `cc-backends` → **Connect** → **EC2 Instance Connect** → **Connect**
- [ ] Copiar y pegar **todo** este comando (es una sola línea):

```bash
cat ~/URLS.txt; R=$(aws rds describe-db-instances --query "DBInstances[?starts_with(DBInstanceIdentifier,'cc-')]|[0].Endpoint.Address" --output text); echo "== RDS: $R"; nc -zv -w5 "$R" 1433 && sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -Q "SET NOCOUNT ON; SELECT COUNT(*) AS tablas FROM sys.tables"; echo "== BACKENDS"; sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'; curl -s -o /dev/null -w "backend1 insumos: %{http_code}\n" localhost:8081/api/insumos; curl -s -o /dev/null -w "backend2 health: %{http_code}\n" localhost:5000/health; curl -s localhost:5000/status/database; echo; echo "== AVANCE"; sudo grep AGRO /var/log/agropacayales.log | tail -3
```

Cómo leer lo que sale:

| Sale | Significa |
| :-- | :-- |
| Bloque `TALLER CLOUD COMPUTING` con URLs | URLs listas para abrir ✅ |
| `== RDS: None` | La RDS aún se está creando: esperar y volver a pegarlo |
| `succeeded!` | La EC2 llega a la RDS por la red ✅ |
| `tablas` con un número | Login OK y datos cargados en RDS ✅ |
| `backend-transaccional` y `backend-analitico` en **Up** | Los 2 backends corren en Docker ✅ |
| `backend1 insumos: 200` | Backend 1 responde con datos de MongoDB ✅ |
| `backend2 health: 200` | Backend 2 responde ✅ |
| JSON de `status/database` | Backend 2 conectado a SQL Server y MongoDB ✅ |
| `Login failed` | La RDS quedó con Secrets Manager: **Modify → Self managed** |
| Última línea `DESPLIEGUE COMPLETO` | Todo terminó ✅ |

---

## 12. Al terminar la presentación

- [ ] **EC2 → Security Groups** → `cc-ec2-sg` → **Edit inbound rules** → **Delete** en SSH 22 y en 27017 → **Save rules**
- [ ] `cc-rds-sg` → **Edit inbound rules** → **Delete** en la regla MSSQL **0.0.0.0/0** → **Save rules**
- [ ] **RDS → Modify** → Public access: **Not publicly accessible** → **Apply immediately**

---

## Si se traba

| Mensaje en el system log | Hacer |
| :-- | :-- |
| `SIN PERMISOS AWS` | Paso 6: **Modify IAM role** → `LabInstanceProfile` |
| `no corresponde a ningún rol` | Nombre mal escrito: **Instance state → Terminate** → relanzar con `cc-mongodb` o `cc-backends` |
| `Esperando ...:1433` | **RDS → Modify** → security group `cc-rds-sg` → **Apply immediately** |
| `Esperando ...:27017` | Paso 2, regla interna: **All traffic** · source `sg-...` de `cc-ec2-sg` |
| `Login failed for user 'admin'` | **RDS → Modify** → **Self managed** (desmarcar Secrets Manager) → New master password `AgroPacayales2026!` → **Apply immediately**. El script reintenta 20 min y sigue solo |
| Frontend abre pero sin datos | Backend 1 tarda ≈ 1 min en arrancar: esperar y recargar |
| Frontend no abre (403/404) | **S3 → bucket → Permissions** → Block public access debe estar **Off**. Si sigue: **S3 → Block Public Access settings for this account → Edit** → desmarcar todo → **Save** → en `cc-backends` ejecutar `sudo /root/publicar-frontend-s3.sh` |
| Reinicié el Learner Lab y el frontend no carga datos | La IP cambió: esperar 2 min, se vuelve a publicar solo. Si no: entrar a `cc-backends` y ejecutar `sudo /root/publicar-frontend-s3.sh` |

---

## Credenciales (ya están dentro del script)

| Componente | Valor |
| :-- | :-- |
| RDS SQL Server | `admin` / `AgroPacayales2026!` · BD `agropacayales_db` · 1433 |
| MongoDB EC2 | `admin` / `Mongo12345` · BD `agropacayales_db` · 27017 · `authSource=admin` |
| Imágenes Docker Hub | `anafelixmendoza21/agropacayales-cc-backend:1.0` · `anafelixmendoza21/agropacayales-cc-backend-analitico:1.0` |
