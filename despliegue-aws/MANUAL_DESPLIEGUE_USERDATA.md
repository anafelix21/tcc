# Manual de despliegue paso a paso — AgroPacayales S.A.C. en AWS

**Kubernetes (K3s) sobre EC2 + SQL Server en Amazon RDS + MongoDB en EC2**

Haz los pasos **en orden, uno detrás de otro**. Todo se hace en la consola web de AWS: sin PowerShell, sin SSH, sin escribir IPs.
Las 5 EC2 llevan **el mismo** user data, [`user-data-universal.sh`](user-data-universal.sh), y se pega **sin cambiar nada**.

⏱ **Tiempo total: 20–25 min.** El reloj de cada paso indica en qué minuto deberías ir.

> **Antes de empezar, ten abierto** el archivo `user-data-universal.sh` para copiarlo (Ctrl+A, Ctrl+C).
> Las imágenes ya están en Docker Hub (`anafelixmendoza21/...:2.0`); no tienes que subir nada.

---

## Paso 1 — Entrar a AWS ⏱ min 0

1.1. Abre AWS Academy → Learner Lab → **Start Lab**. Espera a que el círculo esté **verde**.
1.2. Clic en **AWS** para abrir la consola.
1.3. Arriba a la derecha, verifica la región: **N. Virginia (us-east-1)**.

---

## Paso 2 — Crear el grupo de seguridad de las EC2 ⏱ min 1

2.1. Busca **EC2** → menú izquierdo **Grupos de seguridad** → **Crear grupo de seguridad**.
2.2. Nombre: `evi-ec2-sg` · Descripción: `evi-ec2-sg` · VPC: la predeterminada.
2.3. En **Reglas de entrada → Agregar regla**, agrega estas 2:

| Tipo | Intervalo de puertos | Origen |
| :-- | :-- | :-- |
| TCP personalizado | `30000-30002` | Anywhere-IPv4 (`0.0.0.0/0`) |
| SSH | `22` | Anywhere-IPv4 (`0.0.0.0/0`) — solo para la demo |
| TCP personalizado | `27017` | Anywhere-IPv4 (`0.0.0.0/0`) — MongoDB Compass desde cualquier red |

2.4. Clic en **Crear grupo de seguridad**.

---

## Paso 3 — Permitir el tráfico interno entre las EC2 ⏱ min 2

3.1. Dentro de `evi-ec2-sg` → pestaña **Reglas de entrada** → **Editar reglas de entrada** → **Agregar regla**.
3.2. Tipo: **Todo el tráfico** · Origen: **Personalizada** → escribe `evi-ec2-sg` y selecciónalo.
3.3. **Guardar reglas**.

> Esto deja que las EC2 se hablen entre sí (Kubernetes 6443, MongoDB 27017) **sin abrirlo a internet**.

---

## Paso 4 — Crear el grupo de seguridad de la RDS ⏱ min 3

4.1. **Crear grupo de seguridad** → Nombre: `evi-rds-sg` · Descripción: `evi-rds-sg` · VPC predeterminada.
4.2. **Agregar regla**: Tipo **MSSQL** (puerto 1433) · Origen: **Personalizada** → elegir de la lista el `sg-...` de `evi-ec2-sg`.
4.3. **Agregar regla**: Tipo **MSSQL** (puerto 1433) · Origen: **Anywhere-IPv4** (`0.0.0.0/0`) — SQL Server Management Studio desde cualquier red.
4.4. **Crear grupo de seguridad**. (Aquí **no** va "Todo el tráfico".)

---

## Paso 5 — Crear la base de datos SQL Server en RDS ⏱ min 4

> La RDS tarda 10–15 min en crearse. Por eso va **antes** que las EC2: mientras se crea, tú sigues con los pasos siguientes. **No esperes a que termine.**

5.1. Busca **RDS** → **Bases de datos** → **Crear base de datos**.
5.2. **Creación estándar**.
5.3. Motor: **Microsoft SQL Server** · Edición: **SQL Server Express Edition**.
5.4. Plantilla: **Capa gratuita** (o Desarrollo y pruebas).
5.5. Identificador: `agropacayales-rds-sqlserver`
5.6. Nombre de usuario maestro: `admin`
5.7. Credentials management: **Self managed** (⚠️ **no** "Managed in AWS Secrets Manager": AWS inventaría la contraseña y el master daría `Login failed`) · Contraseña: `AgroPacayales2026!` (escríbela exacta en los dos campos).
5.8. Clase de instancia: `db.t3.micro` (si no aparece, `db.t3.small`).
5.9. Almacenamiento: **gp3**, `20` GiB · **desmarca** "Habilitar escalado automático del almacenamiento".
5.10. Conectividad: VPC predeterminada · **Acceso público: Sí** (para entrar con SSMS desde cualquier PC).
5.11. Grupo de seguridad de VPC: **Elegir existente** → agrega `evi-rds-sg` y **quita** `default`.
5.12. Si aparecen, **desmarca**: Performance Insights y Monitoreo mejorado.
5.13. Abre **Configuración adicional** → **desmarca** "Habilitar copias de seguridad automatizadas".
5.14. Clic en **Crear base de datos**. Si sale una ventana de complementos, ciérrala.

✅ Verás el estado **Creando**. Sigue con el paso 6 **ya mismo**. No copies el endpoint: el master lo encuentra solo.

---

## Paso 6 — Lanzar la EC2 `k8s-master` ⏱ min 7

6.1. Ve a **EC2** → **Instancias** → **Lanzar instancias**.
6.2. Nombre: `k8s-master`
6.3. AMI: **Ubuntu** → **Ubuntu Server 24.04 LTS** (64 bits x86).
6.4. Tipo de instancia: `t3.small`
6.5. Par de claves: elige cualquiera (por ejemplo `vockey`).
6.6. Configuración de red → **Editar**:
   - VPC predeterminada · Asignar automáticamente la IP pública: **Habilitar**
   - Firewall: **Seleccionar un grupo de seguridad existente** → `evi-ec2-sg`
6.7. Configurar almacenamiento: `20` GiB, gp3.
6.8. Abre **Detalles avanzados**:
   - Perfil de instancia de IAM: **`LabInstanceProfile`** ⚠️ (no lo olvides)
   - Datos de usuario (al final de la página): pega **todo** `user-data-universal.sh`.
6.9. Clic en **Lanzar instancia** → **Ver todas las instancias**.

---

## Paso 7 — Lanzar la EC2 `ec2-mongodb` ⏱ min 9

7.1. En la lista de instancias marca `k8s-master` → **Acciones → Imagen y plantillas → Lanzar más como esta**.
   *(Copia sola el user data, el rol IAM y el grupo de seguridad.)*
7.2. Cambia **solo** esto:
   - Nombre: `ec2-mongodb`
   - Tipo: `t3.small`
   - Almacenamiento: `8` GiB
7.3. Baja a **Detalles avanzados** y confirma que el perfil IAM sea `LabInstanceProfile` y que el user data esté pegado.
7.4. **Lanzar instancia**.

---

## Paso 8 — Lanzar la EC2 `k8s-node-frontend` ⏱ min 10

8.1. Marca `k8s-master` → **Acciones → Imagen y plantillas → Lanzar más como esta**.
8.2. Nombre: `k8s-node-frontend` · Tipo: `t3.small` · Almacenamiento: `20` GiB.
8.3. Confirma IAM `LabInstanceProfile` y user data → **Lanzar instancia**.

---

## Paso 9 — Lanzar la EC2 `k8s-node-backend` ⏱ min 11

9.1. Marca `k8s-master` → **Acciones → Imagen y plantillas → Lanzar más como esta**.
9.2. Nombre: `k8s-node-backend` · Tipo: **`t3.medium`** (Spring Boot necesita más RAM) · Almacenamiento: `20` GiB.
9.3. Confirma IAM `LabInstanceProfile` y user data → **Lanzar instancia**.

---

## Paso 10 — Lanzar la EC2 `k8s-node-backendAnalitico` ⏱ min 12

10.1. Marca `k8s-master` → **Acciones → Imagen y plantillas → Lanzar más como esta**.
10.2. Nombre: `k8s-node-backendAnalitico` · Tipo: `t3.small` · Almacenamiento: `20` GiB.
10.3. Confirma IAM `LabInstanceProfile` y user data → **Lanzar instancia**.

---

## Paso 11 — Revisar que las 5 EC2 estén bien ⏱ min 13

11.1. En **Instancias** deben aparecer 5, todas en **En ejecución**:

| Nombre (exacto) | Tipo |
| :-- | :-- |
| `k8s-master` | t3.small |
| `ec2-mongodb` | t3.small |
| `k8s-node-frontend` | t3.small |
| `k8s-node-backend` | t3.medium |
| `k8s-node-backendAnalitico` | t3.small |

11.2. Si un nombre está mal escrito: **termina** esa EC2 y repite su paso.
11.3. Si a una le falta el rol: márcala → **Acciones → Seguridad → Modificar rol de IAM** → `LabInstanceProfile` → **Actualizar rol de IAM**. (No hay que reiniciar; el script espera solo.)

---

## Paso 12 — Esperar y seguir el avance del master ⏱ min 13 → 22

12.1. Marca `k8s-master` → **Acciones → Supervisar y solucionar problemas → Obtener registro del sistema**.
12.2. Busca las líneas con `[AGRO]`. Vuelve a abrirlo cada 1–2 min. Aparecen en este orden:

| # | Mensaje | Qué significa |
| :-- | :-- | :-- |
| 1 | `K3s server instalado` | El clúster Kubernetes existe |
| 2 | `Esperando que RDS SQL Server termine de crearse...` | Normal: se repite hasta que la RDS esté lista |
| 3 | `MongoDB: 172.31.x.x \| RDS: agropacayales-rds-sqlserver...` | Encontró las dos bases de datos |
| 4 | `SQL SERVER POBLADO` | Tablas y +800 registros cargados en RDS |
| 5 | `Manifiestos aplicados...` | Se desplegaron los 3 componentes |
| 6 | `DESPLIEGUE TERMINADO` + URLs | Listo. Debe decir `frontend=200 backend1-insumos=200 backend2-health=200` |
| 7 | `DESPLIEGUE COMPLETO` | Fin |

12.3. Si se queda trabado en un mensaje más de 5 min, ve al **Anexo A**.

---

## Paso 13 — Abrir la aplicación ⏱ min 22

13.1. En **Instancias**, copia la **Dirección IPv4 pública** de cada EC2.
13.2. Abre en el navegador (usa `http://`, no `https://`):

| Qué | URL |
| :-- | :-- |
| Frontend web | `http://<IP de k8s-node-frontend>:30000` |
| Backend 1 — Swagger | `http://<IP de k8s-node-backend>:30001/swagger-ui.html` |
| Backend 1 — OpenAPI (importar en Postman) | `http://<IP de k8s-node-backend>:30001/api-docs` |
| Backend 2 — Swagger | `http://<IP de k8s-node-backendAnalitico>:30002/apidocs/` |
| Backend 2 — health | `http://<IP de k8s-node-backendAnalitico>:30002/health` |
| Backend 2 — estado de BD | `http://<IP de k8s-node-backendAnalitico>:30002/status/database` |

13.3. Prueba en Postman: `GET :30001/api/insumos`, `GET :30001/api/parcelas`, `POST :30001/api/auth/login`, `GET :30002/api/v1/analytics/presupuesto/insumos`.

---

## Paso 13b — Entrar a las bases desde tu PC ⏱ min 23

**SQL Server Management Studio**
13b.1. RDS → `agropacayales-rds-sqlserver` → **Connectivity & security** → copia el **Endpoint**.
13b.2. SSMS → Connect to Server: Server name `<Endpoint>,1433` · **SQL Server Authentication** · `admin` / `AgroPacayales2026!` · Encryption **Mandatory** · ☑ **Trust server certificate** → **Connect**.
13b.3. **Databases → agropacayales_db → Tables**.

**MongoDB Compass**
13b.4. EC2 → `ec2-mongodb` → copia la **Public IPv4 address**.
13b.5. Compass → **Add new connection** → URI: `mongodb://admin:Mongo12345@<IP_PUBLICA>:27017/agropacayales_db?authSource=admin` → **Save & Connect**.


---

## Paso 14 — Demostración ante el docente ⏱ min 24

14.1. Marca `k8s-master` → **Conectar** → pestaña **EC2 Instance Connect** → **Conectar**. Se abre una terminal en el navegador.
14.2. Ejecuta estos comandos uno por uno:

```bash
cat ~/URLS.txt
```
→ URLs y chequeo HTTP automático.

```bash
kubectl get nodes -L role
```
→ **Criterio 1:** 4 nodos, cada worker con su rol (frontend, backend1, backend2).

```bash
kubectl get pods -n agropacayales-namespace -o wide
```
→ **Criterio 1:** cada pod corre en su propio nodo dedicado.

```bash
kubectl -n agropacayales-namespace exec deploy/backend-transaccional -- wget -qO- http://backend-analitico:5000/health
```
→ **Criterio 2:** Backend 1 se comunica con Backend 2 por la red interna del clúster.

```bash
kubectl -n agropacayales-namespace exec deploy/backend-analitico -- curl -s localhost:5000/status/database
```
→ **Criterio 3:** conexión a SQL Server (RDS 1433) y MongoDB (EC2 27017).

```bash
kubectl delete pod -l app=frontend -n agropacayales-namespace
kubectl get pods -n agropacayales-namespace -w
```
→ Self-healing: Kubernetes recrea el pod solo (Ctrl+C para salir).

14.3. **Criterio 4:** muestra el Swagger del paso 13 y ejecuta un endpoint desde ahí o desde Postman.

---

## Paso 15 — Cerrar la demo

15.1. EC2 → Grupos de seguridad → `evi-ec2-sg` → **Editar reglas de entrada** → elimina **SSH 22** y **27017** → **Guardar reglas**.
15.2. `evi-rds-sg` → elimina la regla MSSQL **0.0.0.0/0** → **Guardar reglas**.
15.3. RDS → **Modify** → Public access: **Not publicly accessible** → **Apply immediately**.

✅ **Despliegue terminado.**

---
---

## Anexo 0 — Comando único: revisar que todo esté conectado

- [ ] Marcar ☑ `k8s-master` → **Connect** → **EC2 Instance Connect** → **Connect**
- [ ] Copiar y pegar **todo** este comando (es una sola línea):

```bash
R=$(aws rds describe-db-instances --query "DBInstances[?DBInstanceIdentifier=='agropacayales-rds-sqlserver']|[0].Endpoint.Address" --output text); echo "== RDS: $R"; nc -zv -w5 "$R" 1433 && sudo /opt/mssql-tools18/bin/sqlcmd -C -S "$R,1433" -U admin -P 'AgroPacayales2026!' -d agropacayales_db -Q "SET NOCOUNT ON; SELECT COUNT(*) AS tablas FROM sys.tables; SELECT DISTINCT client_net_address AS ips_conectadas FROM sys.dm_exec_connections"; echo "== PODS"; kubectl get pods -n agropacayales-namespace -o wide; echo "== AVANCE"; sudo grep AGRO /var/log/agropacayales.log | tail -3
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

## Anexo A — Si algo falla

| Síntoma en el registro del sistema | Solución |
| :-- | :-- |
| `SIN PERMISOS AWS: asigna LabInstanceProfile` | Paso 11.3. Continúa solo. |
| `ERROR: el nombre ... no corresponde a ningún rol` | Nombre mal escrito: termina esa EC2 y vuelve a lanzarla con el nombre exacto. |
| `Esperando que RDS...` más de 20 min | En RDS revisa el estado. Si dice "Error", créala de nuevo (paso 5). |
| `Esperando ...:1433` | La RDS no tiene `evi-rds-sg` o la regla no apunta a `evi-ec2-sg`. RDS → Modificar → grupo correcto. Continúa solo. |
| `Esperando ...:27017` o `...:6443` | Falta la regla del paso 3. Agrégala. Continúa solo. |
| `Login failed for user 'admin'` / `Reintento X de la carga SQL` | La contraseña de la RDS no es exactamente `AgroPacayales2026!`. Si en Connectivity & security aparece **Masters credentials ARN**, la RDS usa Secrets Manager: en Modify desmarca *Manage master credentials in AWS Secrets Manager*. RDS → Modify → New master password (escrita a mano) → Continue → Apply immediately. Si el master aún reintenta, sigue solo. **No relances el master** (los workers ya están unidos a él). |
| Ya pasó `Reintento 10` | `k8s-master` → Connect → EC2 Instance Connect → `sudo /opt/mssql-tools18/bin/sqlcmd -C -S "<endpoint RDS>,1433" -U admin -P 'AgroPacayales2026!' -b -i /root/init_sqlserver.sql` → luego `kubectl -n agropacayales-namespace rollout restart deploy/backend-transaccional deploy/backend-analitico`. |
| Pods en `Pending` | Un worker no se unió: revisa su registro del sistema. |
| El frontend abre pero no muestra datos | Backend 1 tarda ≈ 1 min en arrancar. Espera y recarga. |

> El user data solo corre en el **primer arranque**. Si reinicias el Learner Lab todo sigue configurado, pero las **IPs públicas cambian**: vuelve a leerlas (paso 13.1).

---

## Anexo B — Cómo se cumple la rúbrica

| Criterio | Cómo se cumple |
| :-- | :-- |
| **1. Clúster K8s sobre EC2 con nodos dedicados** | K3s con `k8s-master` + 3 workers. Cada worker se etiqueta solo (`role=frontend/backend1/backend2`) y cada Deployment usa `nodeSelector`: Frontend, Backend 1 y Backend 2 corren cada uno en su propia EC2. |
| **2. Conectividad interna Backend 1 ↔ Backend 2** | Backend 1 envía eventos/logs a `http://backend-analitico:5000` (DNS interno). Autenticación JWT en `/api/auth/login`. El frontend llega a ambos backends por su nginx (`/api/...` y `/api/v1/analytics/...`). |
| **3. Persistencia políglota con BD externas** | SQL Server en **Amazon RDS, puerto 1433** (transaccional) y **MongoDB en EC2, puerto 27017** (insumos, usuarios, parcelas, eventos). Se inyectan por ConfigMap y Secret. |
| **4. Endpoints documentados** | Swagger del Backend 1 (30001) y del Backend 2 (30002), y OpenAPI JSON para Postman. |

---

## Anexo C — Seguridad aplicada

- Solo los puertos 30000-30002 son públicos. MongoDB, la API de Kubernetes y el tráfico interno solo se aceptan entre las EC2 de `evi-ec2-sg`. Durante la demo, 27017 queda abierto (con usuario y contraseña) para Compass.
- La RDS acepta 1433 solo desde `evi-ec2-sg` y, durante la demo, desde internet con usuario y contraseña (SSMS). **Al terminar, el paso 15 lo cierra.**
- MongoDB con usuario y contraseña; se abre a la red recién **después** de cargar los datos.
- Contraseñas guardadas en un **Secret** de Kubernetes.
- Al terminar, cada EC2 bloquea el metadata (IMDSv2, hop limit 1): ningún contenedor puede leer el user data ni las credenciales del rol.
- Versiones fijas: imágenes con tag `2.0` y scripts de datos de un commit fijo del repo.

---

## Anexo D — Credenciales (ya están dentro del script)

| Componente | Valor |
| :-- | :-- |
| RDS SQL Server | `admin` / `AgroPacayales2026!` · BD `agropacayales_db` · 1433 |
| MongoDB EC2 | `admin` / `Mongo12345` · BD `agropacayales_db` · 27017 · `authSource=admin` |
| Token K3s | `agropacayales-token-2026` |
| Namespace | `agropacayales-namespace` |

---

## Anexo E — Solo si cambias el código: volver a subir las imágenes

Desde la raíz del repo, con Docker Desktop abierto y `docker login` hecho con `anafelixmendoza21`:

```bash
docker build --platform linux/amd64 -t anafelixmendoza21/agropacayales-frontend:2.0 ASE251S3_T05-fe
docker build --platform linux/amd64 -t anafelixmendoza21/agropacayales-backend:2.0 ASE251S4_T05-be
docker build --platform linux/amd64 -t anafelixmendoza21/agropacayales-backend-analitico:2.0 ASE251S4_T05-be-analitico
docker push anafelixmendoza21/agropacayales-frontend:2.0
docker push anafelixmendoza21/agropacayales-backend:2.0
docker push anafelixmendoza21/agropacayales-backend-analitico:2.0
```

El user data no se toca: siempre descarga el tag `2.0`.
