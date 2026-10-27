# 🎓 Guía de Sustentación — Ana Félix Mendoza (Equipo T05 · AgroPacayales S.A.C.)

Guía para estudiar la **Evaluación del Proyecto Web y Móvil (20 puntos)**. Por cada criterio dice **cómo lo cumplo**, **dónde está la evidencia** y **qué responder**.

---

## 0. Lo mío en una tabla (memorizar)

| Curso | Mi parte (Ana Félix) | Dónde está |
| :-- | :-- | :-- |
| Talleres de Software Empresarial | **Maestro CRUD Parcelas** (MongoDB) | `ASE251S4_T05-be` → `/api/parcelas` |
| Gestión de Base de Datos | **Transacción Cosechas** (SQL Server, cabecera-detalle) + changesets Liquibase **V002** y **V005** | `/api/harvest` · repo `ASE251S4_T05-db` |
| Proyectos de Innovación Tecnológica | **Sección 1 del dashboard: Cosechas y Rendimiento** (6 indicadores A1–A6) + **Servicio 3: reposición de stock crítico** | `ASE251S4_T05_ba` → `/api/v1/analytics/cosechas/...` |
| Desarrollo de Aplicaciones Móviles | App móvil (maestros, transacciones, cosechas) | `ASE251S4_T05-mo` |
| Cloud Computing / Orquestadores | Despliegue completo en AWS con **user data** (Kubernetes y Taller) | `despliegue-aws/` y `despliegue-taller-cloud/` |

> **Frase para empezar:** "Yo soy Ana Félix. Me encargué del maestro **Parcelas** en MongoDB, de la transacción **Cosechas** en SQL Server, de la **sección Cosechas del dashboard** con 6 indicadores y del **servicio de reposición de stock crítico**. Además automaticé el **despliegue en AWS** con un user data que levanta todo solo."

---

## 1. Criterios de admisibilidad (revisar antes de entrar)

Sin estos no se califica. **No están en el código: confírmalos con tu equipo.**

- [ ] Plan de acción actualizado hasta el Sprint 08
- [ ] Carpetas de Drive actualizadas hasta el Sprint 08
- [ ] Actas de reuniones realizadas
- [ ] Proyectos unificados e integrados → ✅ frontend, backend, backend analítico y móvil usan **las mismas bases** y se comunican entre sí

---

## 2. Rutas de Ana Félix (para la demo)

**Puertos según el despliegue:**

| Componente | Kubernetes (orquestadores) | Taller Cloud Computing |
| :-- | :-- | :-- |
| Backend 1 (Spring Boot) | `http://<IP k8s-node-backend>:30001` | `http://<IP cc-backends>:8081` |
| Backend 2 Analítico (Flask) | `http://<IP k8s-node-backendAnalitico>:30002` | `http://<IP cc-backends>:5000` |
| Frontend | `http://<IP k8s-node-frontend>:30000` | `http://agropacayales-frontend-<cuenta>.s3-website-us-east-1.amazonaws.com` |
| Swagger Backend 1 | `…:30001/swagger-ui.html` | `…:8081/swagger-ui.html` |
| Swagger Backend 2 | `…:30002/apidocs/` | `…:5000/apidocs/` |

### 2.1 Maestro Parcelas — MongoDB (Backend 1)

| Acción | Método y ruta |
| :-- | :-- |
| Listar | `GET /api/parcelas` |
| Listar por estado (activas / eliminadas) | `GET /api/parcelas/estado/true` · `GET /api/parcelas/estado/false` |
| Buscar por id | `GET /api/parcelas/{id}` |
| **Registrar** | `POST /api/parcelas` |
| **Editar** | `PUT /api/parcelas/{id}` |
| **Eliminar** (lógico) | `PATCH /api/parcelas/{id}/eliminar` |
| **Restaurar** | `PATCH /api/parcelas/{id}/restaurar` |
| **Importar CSV** | `POST /api/parcelas/importar/csv` (campo `file`) |
| **Importar Excel** | `POST /api/parcelas/importar/excel` (campo `file`) |
| **Exportar Excel** | `GET /api/parcelas/exportar/excel` |
| **Exportar PDF** | `GET /api/parcelas/exportar/pdf` |

Archivo para importar: `ASE251S4_T05-be/csv/parcelas.csv` (**15 registros**).

### 2.2 Transacción Cosechas — SQL Server (Backend 1)

| Acción | Método y ruta |
| :-- | :-- |
| Listar | `GET /api/harvest` |
| Buscar por id | `GET /api/harvest/{id}` |
| Registrar (cabecera + detalles) | `POST /api/harvest` |
| Editar | `PUT /api/harvest/{id}` |
| Eliminar (lógico) | `PUT /api/harvest/eliminar/{id}` |
| Restaurar | `PUT /api/harvest/restaurar/{id}` |

### 2.3 Mis 6 indicadores — Sección 1: Cosechas y Rendimiento (Backend 2)

Prefijo: `/api/v1/analytics/cosechas`

| # | Indicador | Ruta | Gráfico en el dashboard | Cómo se calcula |
| :-: | :-- | :-- | :-- | :-- |
| A1 | Resumen de cosechas | `/resumen` | **Cards** | Total de cosechas, kilos óptimos, kilos de merma, kilos totales, % de merma y % de eficiencia |
| A2 | Calidad: óptimo vs merma | `/calidad` | **Gráfico circular** | Kilos y % óptimo (exportable) frente a merma |
| A3 | Producción y merma por cultivo | `/por-cultivo` | **Gráfico de barras** | `groupby("cultivo")` → suma de kilos y tasa de merma |
| A4 | Evolución mensual | `/mensual` | Línea / barras | `groupby("periodo")` → cosechas y kilos por mes |
| A5 | Desempeño por responsable | `/por-responsable` | **Tabla** | `groupby("responsable")` → kilos y % de merma por persona |
| A6 | Rendimiento kg/ha por parcela | `/rendimiento-parcela` | Barras / tabla | **Une SQL Server (cosechas) con MongoDB (hectáreas de parcelas)** |
| — | Sección completa | `/seccion` | Dashboard de Ana | Junta cards + circular + barras + tabla |

### 2.4 Servicio 3 — Reposición de insumos críticos (Backend 2)

`GET /api/v1/analytics/presupuesto/stock-critico`

### 2.5 Salud y conexión

| Ruta | Para qué |
| :-- | :-- |
| `GET /health` (Backend 2) | El servicio está vivo |
| `GET /status/database` (Backend 2) | Conexión a **SQL Server** y **MongoDB** (`UP` / `DOWN`) |
| `GET /api/v1/analytics/dashboard/general` | Dashboard general del equipo |

---

## 3. JSON para la demo en Swagger

> 📎 Los JSON de **los 3 maestros** (Parcelas, Insumos, Usuarios), probados contra el backend real, están en [`JSON_MAESTROS_SWAGGER.md`](JSON_MAESTROS_SWAGGER.md).

**Registrar parcela** (`POST /api/parcelas`):
```json
{
  "nombre": "Parcela Demo Ana",
  "ubicacion": "Valle de Cañete - Sector B",
  "areaHectareas": 8.5,
  "tipoSuelo": "Franco",
  "responsable": "Ana Félix",
  "estadoRiego": "Completo (Goteo)",
  "fechaUltimaSiembra": "2026-08-15",
  "produccionEstimada": "25 toneladas",
  "cultivoActual": "Palta",
  "observaciones": "Parcela de demostración",
  "hectareas": 8.5,
  "condicionesEdaficas": { "textura": "Franco arenoso", "phPromedio": 6.8, "materiaOrganicaPct": 2.4 },
  "sistemaRiego": { "tipo": "Goteo", "caudalLph": 4.5, "sectorValvula": "V-12" }
}
```
Para **editar**, usar `PUT /api/parcelas/{id}` con el mismo JSON, cambiando por ejemplo `"cultivoActual": "Mandarina"`. Después mostrar que `updatedAt` cambió.

**Registrar cosecha** (`POST /api/harvest`):
```json
{
  "responsable": "Ana Félix",
  "fechaCosecha": "2026-10-20",
  "detalles": [
    { "idCultivo": 1, "kilosOptimos": 1200.50, "kilosMerma": 85.25 },
    { "idCultivo": 2, "kilosOptimos": 980.00, "kilosMerma": 40.00 }
  ]
}
```

---

## 4. Criterios por curso: cómo cumplo cada uno

### ☁️ Taller de Cloud Computing (3.5 pts)

Despliegue: `despliegue-taller-cloud/` (manual `MANUAL_TALLER_CLOUD.md` + `user-data-taller.sh`).

| Criterio | Pts | Cómo lo cumplo | Evidencia en la consola |
| :-- | :-: | :-- | :-- |
| 2 BD con 2 servicios diferentes de AWS | 1 | **SQL Server en Amazon RDS** (`cc-taller-rds-sqlserver`, puerto 1433) + **MongoDB en Amazon EC2** (`cc-mongodb`, puerto 27017) | RDS → Databases · EC2 → Instances |
| 2 BE con mínimo 1 servicio de AWS | 1 | Backend 1 y Backend 2 en **Docker sobre Amazon EC2** (`cc-backends`, puertos 8081 y 5000) | EC2 → `cc-backends` → `docker ps` |
| FE con 1 servicio diferente | 0.5 | Frontend React en **Amazon S3** (Static website hosting) | S3 → bucket → Properties → Static website hosting |
| Mínimo 4 servicios diferentes según la arquitectura | 1 | **VPC** (red y grupos de seguridad), **EC2**, **RDS**, **S3** (+ IAM con `LabInstanceProfile`) | VPC · EC2 · RDS · S3 |

**Qué decir:** "Usé 4 servicios. **VPC** para la red y los grupos de seguridad. **EC2** para MongoDB y los dos backends. **RDS** para SQL Server. **S3** para el frontend como sitio estático. Todo se crea con un único **user data**: cada EC2 lee su nombre y sabe qué instalar."

### ☸️ Orquestadores y Automatización de Software (3.5 pts)

Despliegue: `despliegue-aws/` (manual `MANUAL_RAPIDO.md` + `user-data-universal.sh`).

| Criterio | Pts | Cómo lo cumplo | Cómo lo demuestro |
| :-- | :-: | :-- | :-- |
| Clúster K8s sobre EC2 con **nodos dedicados** para FE, BE1 y BE2 | 1 | **K3s**: `k8s-master` + 3 workers. Cada worker se etiqueta solo (`role=frontend`, `role=backend1`, `role=backend2`) y cada Deployment tiene **`nodeSelector`** a su nodo | `kubectl get nodes -L role` · `kubectl get pods -n agropacayales-namespace -o wide` |
| Conectividad interna BE1 ↔ BE2 (negocio, autenticación, autorización, logs e ingesta) | 1 | El BE1 llama al BE2 por **DNS interno** del clúster (`ANALYTICS_URL=http://backend-analitico:5000`). Cada alta, edición o baja exitosa genera un **evento** (`EventoNegocioWebFilter`) que se ingesta en `POST /api/v1/analytics/eventos` y se guarda en MongoDB (`eventos_negocio`). **Autenticación** con JWT en el BE1 (`/api/auth/login`, filtro `AuthWebFilter`) y **autorización** por roles (ADMIN, SUPERVISOR, AGRÓNOMO, OPERARIO) en el frontend y la app móvil según el rol del token | `kubectl -n agropacayales-namespace exec deploy/backend-transaccional -- wget -qO- http://backend-analitico:5000/health` · `GET /api/v1/analytics/eventos/ultimos` |
| Rutas y reglas de red con **RDS 1433** y **MongoDB 27017** | 1 | **ConfigMap** con el endpoint de RDS y **Secret** con `MONGO_URI`. Grupos de seguridad: `evi-rds-sg` solo acepta 1433 desde las EC2; `evi-ec2-sg` permite 27017, 6443 y Flannel solo entre EC2 | `kubectl get cm,secret -n agropacayales-namespace` · `GET /status/database` → SQL y Mongo `UP` |
| Endpoints documentados con Postman u OpenAPI (Swagger) | 0.5 | **NodePort**: 30001 Swagger del BE1, 30002 Swagger del BE2, 30000 frontend | `…:30001/swagger-ui.html` · `…:30002/apidocs/` · `…:30001/api-docs` (Postman) |

**Comando único para mostrar todo** (en `k8s-master` → EC2 Instance Connect):
```bash
kubectl get nodes -L role && kubectl get pods -n agropacayales-namespace -o wide && kubectl get svc -n agropacayales-namespace
```
**Self-healing:** `kubectl delete pod -l app=frontend -n agropacayales-namespace` → Kubernetes lo recrea solo en su nodo.

### 🏢 Talleres de Software Empresarial (3.5 pts) — mi maestro: **Parcelas**

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Mín. 12 campos funcionales con 4 de auditoría (fecha y hora) | 0.5 | **Parcela** tiene más de 20 campos: nombre, ubicación, áreaHectareas, tipoSuelo, responsable, estadoRiego, fechaUltimaSiembra, producciónEstimada, cultivoActual, observaciones, hectáreas, enUso, estado, más **condicionesEdaficas** (textura, phPromedio, materiaOrganicaPct) y **sistemaRiego** (tipo, caudalLph, sectorValvula) **embebidos**. **4 campos de auditoría `LocalDateTime` (fecha y hora):** `createdAt`, `updatedAt`, `deletedAt`, `restoredAt` |
| Registrar y editar con Postman/Swagger | 1 | `POST /api/parcelas` → llena `createdAt` · `PUT /api/parcelas/{id}` → actualiza `updatedAt` |
| Eliminar y restaurar con Postman/Swagger | 1 | `PATCH /api/parcelas/{id}/eliminar` → `estado=false` + `deletedAt` · `PATCH /api/parcelas/{id}/restaurar` → `estado=true` + `restoredAt` |
| Importar (mín. 10) y exportar (mín. 10) | 1 | `POST /api/parcelas/importar/csv` con `csv/parcelas.csv` (**15 registros**); responde total, importados y fallidos · `GET /api/parcelas/exportar/excel` y `/exportar/pdf` |

**Qué decir:** "El eliminado es **lógico**: no se borra de MongoDB, cambia el `estado` y se guarda la fecha y hora en `deletedAt`, para no perder historial. Al restaurar se registra `restoredAt`."

### 📱 Desarrollo de Aplicaciones Móviles (3.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Estructura de carpetas | — | `src/app` (pantallas con Expo Router), `src/services`, `src/modules`, `src/components`, `src/context`, `src/config`, `src/theme`, `src/utils` (README de `ASE251S4_T05-mo`) |
| Conexión a la BD por un **service** que consume la API | 1 | La app **nunca** toca la base de datos: `src/services/apiClient.ts` (fetch + token JWT) y `crudService.ts` consumen el Backend 1 y el 2. Las URLs vienen de `.env` (`EXPO_PUBLIC_API_URL`) |
| Tabla maestra: modificar y eliminar un registro | 0.5 | Maestros (insumos, **parcelas**, usuarios): `maestro/[modulo]/formulario.tsx` edita; `maestro/[modulo]/[id].tsx` elimina y restaura |
| Lista de 10 registros y formulario de registro | 1 | `maestro/[modulo]/index.tsx` lista los registros de la BD (hay 160 parcelas cargadas) con búsqueda; botón **Registrar** abre el formulario con validaciones |

### 🗄️ Gestión de Base de Datos (3.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Versionamiento de la persistencia políglota | 1 | **Liquibase** (repo `ASE251S4_T05-db`): un `changelog.xml` por motor y changesets **V001 a V005** para **SQL Server y MongoDB a la vez (simétricos)**. Cada changeset tiene autor, comentario y **rollback**. Liquibase registra lo aplicado en su tabla de control, y un **checker** compara un `release-manifest.json` con lo aplicado. **Míos: V002 `insumos_kardex` y V005 `auditoria_labores`** |
| Implementar la persistencia políglota en SQL Server y MongoDB | 1 | **SQL Server (RDS):** `harvest`, `harvest_planting_cycle`, `actividad_cultivo`, `detalle_actividad`, `asignacion_cabecera`, `asignacion_detalle`, `cultivos` con PK, FK, CHECK y UNIQUE. **MongoDB:** `parcelas`, `insumos`, `usuarios`, `fichas_campo`, `eventos_negocio` (documentos embebidos) |
| CRUD de maestros (Mongo) interactuando con transacciones (SQL) | 1.5 | Las transacciones guardan **claves lógicas** de los maestros (`INS-…`, `USR-…`, `PARC-…`). **Mi ejemplo:** la cosecha (`harvest` + `harvest_planting_cycle`) se registra por cultivo, y el indicador **A6 rendimiento kg/ha** cruza los kilos de SQL Server con las **hectáreas de la parcela en MongoDB** |

**Mi transacción cabecera-detalle:**
```
harvest (cabecera)                     harvest_planting_cycle (detalle)
├─ id_harvest  PK  ◄──────────────────┤ id_harvest   FK (ON DELETE CASCADE)
├─ responsable                         ├─ id_harvest_detail PK
├─ fecha_cosecha                       ├─ id_cultivo  FK → cultivos
├─ estado (lógico)                     ├─ kilos_optimos
└─ created_at / updated_at             └─ kilos_merma
```
"Una cosecha tiene varios detalles, uno por cultivo. Al editar, el servicio actualiza la cabecera, **borra los detalles anteriores** (`deleteByIdHarvest`) y vuelve a insertar los nuevos, todo de forma reactiva con **R2DBC**."

### 💡 Proyectos de Innovación Tecnológica (2.5 pts)

| Criterio | Pts | Cómo lo cumplo |
| :-- | :-: | :-- |
| Arquitectura definida del Backend Analítico | 0.5 | `app/config`, `database`, `models`, `repositories`, `routes`, `schemas`, `services`, `static` + `tests/`, `.env.example`, `.gitignore`, `README.md`, `requirements.txt` ✅ (repo `ASE251S4_T05_ba`) |
| Figma: dashboard por sección (3 cards, 1 circular, 1 barras, 1 tabla) | 0.5 | **Mi sección Cosechas:** cards = A1 · circular = A2 · barras = A3 · tabla = A5 ⚠️ *Tener el link de Figma a mano (no está en el repo)* |
| Figma: dashboard general | 0.5 | `/api/v1/analytics/dashboard/general` integra los indicadores de Ana, Hugo y Axel ⚠️ *link de Figma a mano* |
| 6 indicadores funcionales por estudiante en Swagger/Postman | 1 | **A1 a A6** en `/api/v1/analytics/cosechas/...`, documentados en Swagger (`/apidocs/`, grupo **"Ana Félix - Cosechas"**) y con caché de 60 s |

---

## 5. Cómo hice el levantamiento y por qué

### Idea central
**Un solo user data para todas las EC2.** Cada EC2 lee su etiqueta **Name** con la API de AWS y decide qué instalar. Así no se edita nada a mano, no hay IPs escritas y se evitan errores en la evaluación.

### Kubernetes (orquestadores) — 5 EC2 + RDS

| Paso | Qué hice | Por qué |
| :-: | :-- | :-- |
| 1 | Grupos de seguridad `evi-ec2-sg` (30000-30002 públicos, todo el tráfico solo entre EC2) y `evi-rds-sg` (1433 solo desde las EC2) | Solo la app es pública; las bases y el clúster quedan protegidos |
| 2 | **Primero la RDS** SQL Server (tarda 10–15 min) | Mientras se crea, lanzo las EC2 en paralelo: todo listo en unos 25 min |
| 3 | 5 EC2 con el mismo user data: `k8s-master`, `ec2-mongodb`, `k8s-node-frontend`, `k8s-node-backend`, `k8s-node-backendAnalitico` | El nombre define el rol |
| 4 | `ec2-mongodb` instala MongoDB 8, crea usuario y contraseña, carga los datos y **recién después** abre el puerto | Los backends nunca se conectan a una base vacía |
| 5 | Los workers buscan solos la IP del master, se unen con el token y **se etiquetan** (`role=...`) | Aislamiento de nodos con `nodeSelector` |
| 6 | El master encuentra solo el endpoint de RDS y la IP de Mongo, **carga SQL Server** y aplica los manifiestos (Namespace, ConfigMap, Secret, Deployments, Services NodePort) | Persistencia políglota conectada automáticamente |
| 7 | Seguridad: credenciales en un **Secret**, versiones fijas (imágenes `2.0`, scripts de datos de un commit fijo) e **IMDSv2 con hop limit 1** | Ningún contenedor puede leer las credenciales de AWS |

### Taller Cloud Computing — 2 EC2 + RDS + S3
Mismo enfoque, con nombres propios (`cc-…`) para no chocar con Kubernetes en el mismo laboratorio. `cc-backends` levanta los 2 backends en Docker, carga SQL Server y **publica el frontend en S3** reemplazando la IP de los backends. Si el lab se reinicia y la IP cambia, se vuelve a publicar solo.

---

## 6. Preguntas probables (con respuesta corta)

1. **¿Por qué MongoDB para parcelas y SQL Server para cosechas?** — Parcelas tiene datos flexibles y **embebidos** (suelo y riego) → documento. Cosechas necesita **integridad referencial** cabecera-detalle (FK) → relacional.
2. **¿Qué es el borrado lógico?** — No borro el documento: cambio `estado` a `false` y guardo `deletedAt`. Así se puede restaurar y se conserva el historial.
3. **¿Cuáles son los 4 campos de auditoría?** — `createdAt`, `updatedAt`, `deletedAt`, `restoredAt`, tipo `LocalDateTime` (fecha y hora).
4. **¿Cómo importas?** — `POST /api/parcelas/importar/csv` con el archivo en el campo `file`. Se procesa fila por fila y responde cuántas se importaron y cuáles fallaron con su motivo.
5. **¿Por qué WebFlux?** — Es reactivo y no bloqueante: atiende muchas peticiones con pocos hilos. Por eso uso Mongo Reactive y **R2DBC** para SQL Server.
6. **Explica A6.** — Agrupa los kilos cosechados por parcela (SQL Server), trae las hectáreas de cada parcela desde MongoDB y divide: **kg/ha**. Es el indicador que integra las dos bases.
7. **¿Qué decisión apoya tu sección?** — Qué cultivo y qué responsable tienen **más merma**, para enfocar capacitación y mejorar la calidad exportable.
8. **¿Qué hace tu servicio de stock crítico?** — Un **pipeline de agregación de MongoDB**: filtra insumos con stock de 1 a 15, calcula las unidades para llegar a 30 y el costo (unidades × precio). Devuelve el **presupuesto total en soles** y la decisión: aprobar la compra.
9. **¿Qué hiciste en el versionamiento?** — Los changesets **V002** (`insumos_kardex` en SQL y `insumos` con dosificación embebida en Mongo) y **V005** (`auditoria_labores` en los dos motores), cada uno con su **rollback**.
10. **¿Cómo se comunica el BE1 con el BE2 en Kubernetes?** — Por el **Service** `backend-analitico` (DNS interno del clúster), sin IPs.
11. **¿Cómo saben los pods dónde está la RDS?** — El master la descubre con la API de AWS y la escribe en el **ConfigMap** (`SQL_HOST`). Las credenciales van en el **Secret**.
12. **¿Qué pasa si se cae un pod?** — El Deployment lo recrea solo en el mismo nodo (self-healing).
13. **¿Por qué NodePort y no LoadBalancer?** — En el Learner Lab no hay balanceador administrado; NodePort expone cada servicio en un puerto fijo (30000–30002) del nodo.
14. **¿La app móvil se conecta a la base?** — No. Pasa por `services/apiClient.ts`, que consume la API REST con el token JWT.

---

## 7. Lo que debo decir con honestidad si me lo preguntan

| Tema | Respuesta |
| :-- | :-- |
| `SECURITY_ENFORCE=false` en los despliegues | "Lo dejé así para probar Swagger y Postman sin token en la demo. Con `true`, toda ruta `/api/**` sin token responde 401." |
| Contraseñas de usuarios | "Hoy se comparan en texto plano. La mejora es **BCrypt**." |
| Credenciales en `application.yml` | "Son valores por defecto para desarrollo; en AWS se reemplazan por variables de entorno (ConfigMap y Secret)." |
| Figma | Tener abiertos los links de tu sección y del dashboard general antes de empezar. |

---

## 8. Guion de demo (5 minutos)

1. **Consola AWS:** EC2 (5 instancias), RDS (Available), grupos de seguridad.
2. **`k8s-master`:** `kubectl get nodes -L role` y `kubectl get pods -o wide` → cada pod en su nodo.
3. **Swagger BE1:** `POST /api/parcelas` → `PUT` → `PATCH eliminar` → `PATCH restaurar` → importar `parcelas.csv` → exportar Excel.
4. **Swagger BE1:** `POST /api/harvest` con 2 detalles.
5. **Swagger BE2:** `/cosechas/resumen`, `/calidad`, `/rendimiento-parcela` y `/presupuesto/stock-critico`.
6. **Frontend y app móvil:** la parcela y la cosecha nuevas aparecen en la lista y en el dashboard.
7. **Self-healing:** borrar el pod del frontend y ver cómo se recrea.
