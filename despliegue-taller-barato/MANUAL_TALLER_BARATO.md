# Manual clic por clic — Taller de Cloud Computing al mínimo costo

**Meta:** el proyecto completo (SQL Server, MongoDB, Backend Java, Backend Python y Frontend) en AWS con **4 servicios** y el **menor costo mensual**, desplegado con **un solo archivo** de CloudFormation. No se usa el CMD de la PC: la terminal se abre en el navegador.

| Servicio AWS | Para qué |
| :-- | :-- |
| **Amazon EC2** | 1 sola instancia con 4 contenedores Docker: SQL Server Express, MongoDB, Backend 1 (Java) y Backend 2 (Python) |
| **Amazon EBS** | Disco de 16 GiB gp3 de esa EC2 |
| **Amazon S3** | Frontend como sitio web estático |
| **Amazon VPC** | Red propia, grupo de seguridad e IP elástica |

*(El despliegue lo hace **AWS CloudFormation**, que no tiene costo.)*

```
Navegador ──► Amazon S3 (Frontend) ──► EC2 taller-todo-en-uno ──► Docker: Backend 1 Java :8081
                                         (IP elástica, VPC)       Docker: Backend 2 Python :5000
                                                                  Docker: SQL Server Express + MongoDB (internos)
```

> Costo estimado y pasos de la calculadora: [`COSTOS_CALCULADORA.md`](COSTOS_CALCULADORA.md).

---

## 1. Learner Lab ⏱ min 0

- [ ] **Start Lab** → esperar el círculo verde → clic **AWS**
- [ ] Región: **N. Virginia (us-east-1)**
- [ ] Antes de empezar, **apagar o borrar** instancias de otros laboratorios (el Learner Lab tiene un límite de vCPU).

## 2. Crear todo con CloudFormation ⏱ min 1

- [ ] Buscar **CloudFormation** → **Create stack** → **With new resources (standard)**
- [ ] **Choose an existing template** → **Upload a template file** → **Choose file** → [`taller-cloud-barato.yaml`](taller-cloud-barato.yaml) → **Next**
- [ ] Stack name: `taller` → en **Parameters** dejar:
  - `Capacidad` = **Spot** (la más barata) — o `OnDemand` si quieren cero riesgo de interrupción
  - `InstanceType` = `t3a.medium`
  - el resto sin tocar
- [ ] **Next** → **Next** → **Submit**
- [ ] Esperar **CREATE_COMPLETE** (~3 min)

> Si el stack falla con un error de **Spot** o de **Launch Template** (pestaña **Events**), es que el Learner Lab no permite Spot: **Delete** el stack y vuélvanlo a crear con `Capacidad = OnDemand` (costo estimado ≈ US$ 32.4).

## 3. Esperar la instalación ⏱ min 4

- [ ] **EC2 → Instances →** marcar `taller-todo-en-uno` → **Connect** → **EC2 Instance Connect** → usuario `ubuntu` → **Connect**
- [ ] Ver el avance:

```bash
tail -f /var/log/taller.log
```

Esperar la línea **`TALLER LISTO`**. Debe tardar **~8–10 min** desde el **Submit** (estimado). Salir con **Ctrl+C**.

```bash
cat /home/ubuntu/URLS.txt
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
free -m
```

Deben verse 4 contenedores **Up**: `mssql`, `mongo`, `backend-analitico` y `backend-transaccional`.

> Si abrieron la terminal antes de que terminara, ciérrenla y ábranla de nuevo.

## 4. Abrir la aplicación

Pestaña **Outputs** del stack `taller`:

- **Frontend** → sitio web en S3 (`http://….s3-website-us-east-1.amazonaws.com`)
- **Backend1Swagger** → `http://IP:8081/swagger-ui.html`
- **Backend2Swagger** → `http://IP:5000/apidocs/`

> Los backends tardan ~1–2 min después de `TALLER LISTO` en responder todo. Si el frontend carga pero no muestra datos, esperen un minuto y recarguen.

## 5. Evidencias para el video (cámara activa)

**a) Los 4 servicios en la consola de AWS**

| Servicio | Dónde mostrarlo |
| :-- | :-- |
| EC2 | **EC2 → Instances**: `taller-todo-en-uno` en **Running**, tipo `t3a.medium` |
| EBS | **EC2 → Volumes**: 1 volumen **gp3** de **16 GiB** |
| S3 | **S3 →** bucket del Output **Bucket** → archivos y **Properties → Static website hosting** |
| VPC | **VPC → Your VPCs** (`taller-barato-vpc`), **Security Groups** y **Elastic IPs** |

**b) Bases de datos** (en la terminal de la EC2)

```bash
# SQL Server
docker exec mssql /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'AgroPacayales2026!' -Q "SELECT name FROM sys.databases"
docker exec mssql /opt/mssql-tools18/bin/sqlcmd -C -S localhost -U sa -P 'AgroPacayales2026!' -d agropacayales_db -Q "SELECT COUNT(*) AS cultivos FROM dbo.cultivos"

# MongoDB
docker exec mongo mongosh "mongodb://admin:Mongo12345@localhost:27017/agropacayales_db?authSource=admin" --quiet --eval "db.getCollectionNames().forEach(c => print(c, db[c].countDocuments()))"
```

**c) Backends:** abrir los dos Swagger y ejecutar un `GET` (por ejemplo `/api/insumos` en el Backend 1 y `/health` en el Backend 2).

**d) Frontend:** abrir el sitio de S3 y recorrer el dashboard.

**e) Costo:** seguir [`COSTOS_CALCULADORA.md`](COSTOS_CALCULADORA.md) y mostrar la calculadora con el total.

## 6. Al terminar (¡en este orden!)

1. **Cancelar la solicitud Spot** (solo si usaron `Spot`): **EC2 →** menú izquierdo **Spot Requests** → marcar la solicitud → **Actions → Cancel request** (dejar marcado terminar instancias).
2. **Vaciar el bucket de S3:** **S3 →** el bucket → **Empty** → escribir `permanently delete` → **Empty**.
3. **CloudFormation → `taller` → Delete.**

> Si no vacían el bucket, el stack no se puede borrar. Si no cancelan la solicitud Spot, AWS podría seguir lanzando una instancia.

**Pausar sin borrar:** **Stop Lab**. La IP elástica no cambia, así que el frontend sigue apuntando bien; los contenedores arrancan solos (~2 min).

---

## Problemas frecuentes

| Síntoma | Solución |
| :-- | :-- |
| Stack en `ROLLBACK_COMPLETE` | Ver el error en **Events**, **Delete** y crear de nuevo. Si es Spot → `Capacidad = OnDemand` |
| No existe `/var/log/taller.log` | La EC2 no pudo bajar su script de GitHub: el repo debe ser **público** y la rama `develop` debe existir |
| `mssql` en `Restarting` | Falta memoria: `docker logs mssql`. Confirmar que la EC2 es de 4 GiB (`t3a.medium`) |
| El frontend carga pero sin datos | Esperar 1–2 min a que el Backend 1 termine de arrancar; comprobar `http://IP:8081/api/insumos` |
| La EC2 aparece `Stopped` sola | Con Spot, AWS reclamó la capacidad: arranca sola; si no, **Instance state → Start** |
| El navegador no abre el Swagger | Usar `http://` (no https) con la **IP elástica** del Output |
