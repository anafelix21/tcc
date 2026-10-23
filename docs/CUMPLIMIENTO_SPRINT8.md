# Sprint 8 — Cumplimiento de la rúbrica (Proyecto Web y Móvil, 20 pts)

Leyenda: ✅ listo en el código · 🟡 listo, falta evidencia/acción del equipo · ⏳ pendiente (despliegue AWS / Kubernetes)

## Componentes del proyecto

| Componente | Carpeta | Tecnología | Puerto |
|---|---|---|---|
| Frontend web | `ASE251S3_T05-fe` | Angular | 80 |
| App móvil | `ASE251S4_T05-mobile` | React Native + Expo + TypeScript | — |
| Backend 1 | `ASE251S4_T05-be` | Spring Boot WebFlux (Java 21) | 8081 |
| Backend 2 Analítico | `ASE251S4_T05-be-analitico` | Python + Flask + Pandas | 5000 |
| Bases de datos | `ASE251S4_T05-db` | SQL Server 2022 + MongoDB | 1433 / 27017 |
| Documentación Swagger (OpenAPI) | `docs/GUIA_SWAGGER.md` | Swagger UI interactivo (BE1 y BE2) | 8081 / 5000 |
| Pruebas de punta a punta | `probar-todo.ps1`, `scripts/` | 86 pruebas automáticas | — |

División por estudiante (según los módulos transaccionales del esquema):
**Ana Félix → Cosechas** · **Hugo Fernández → Actividades e Insumos** · **Axel Huapaya → Personal / Asignaciones**

---

## Criterios de admisibilidad (sin esto no se califica)
| Criterio | Estado | Acción |
|---|---|---|
| Plan de acción actualizado hasta el sprint 8 | 🟡 | Actualizar en Drive (tarea del equipo) |
| Carpetas Drive actualizadas hasta el sprint 8 | 🟡 | Subir este documento, guía Swagger, capturas, video |
| Actas de reuniones | 🟡 | Redactar actas de las reuniones del sprint |
| Proyectos unificados e integrados | ✅ | Monorepo con fe, be, ba, db, mobile; el Backend 1 envía eventos al Backend 2 |

---

## Taller de Cloud Computing (3.5) — ⏳ fase de despliegue
| Criterio | Pts | Plan |
|---|---|---|
| 2 BD con 2 servicios AWS distintos | 1 | SQL Server → **Amazon RDS**; MongoDB → **EC2** (o Atlas) |
| 2 BE con mínimo 1 servicio AWS | 1 | **EC2** (nodos del clúster) / EKS |
| FE con 1 servicio AWS diferente | 0.5 | **S3 + CloudFront** (Angular compilado) o nodo EC2 dedicado |
| Mínimo 4 servicios AWS según arquitectura | 1 | RDS + EC2 + S3/CloudFront + EKS/ELB (+ ECR para imágenes) |

## Orquestadores y Automatización (3.5)
| Criterio | Pts | Estado | Evidencia / plan |
|---|---|---|---|
| Clúster K8s en AWS con nodos dedicados (FE, BE1, BE2) | 1 | ⏳ | Manifiestos con `nodeSelector`/taints por nodo (siguiente fase) |
| Conectividad interna BE1 ↔ BE2, auth, autorización, logs/ingesta | 1 | ✅ código / ⏳ clúster | BE1: `security/AuthWebFilter`, `rest/AuthController` (JWT, rol ADMIN), `events/EventoNegocioWebFilter` → `POST {ANALYTICS_URL}/api/v1/analytics/eventos`. En K8s: `ANALYTICS_URL=http://backend-analitico-svc:5000` |
| Rutas y reglas de red hacia SQL Server RDS (1433) y MongoDB (27017) | 1 | ⏳ | Services `ExternalName` + Secrets + Security Groups |
| Endpoints documentados (Swagger OpenAPI 3.0 & Flasgger) | 0.5 | ✅ | Swagger BE1 `/swagger-ui.html`, BE2 `/apidocs`, guía `docs/GUIA_SWAGGER.md` |

> 💡 **Alineación Frontend Web y Móvil**:
> - **Frontend Web (`ASE251S3_T05-fe`)**: Desarrollado en **Angular 19**. Cuenta con todos los módulos transaccionales, el nuevo **Dashboard Analítico** (secciones de Ana, Hugo y Axel con gráficos SVG y tablas), y el importador/exportador de Insumos con modal de auditoría.
> - **App Móvil (`ASE251S4_T05-mobile`)**: Desarrollada en **React Native (Expo + TypeScript)**. Satisface al 100% el curso de *Desarrollo de Aplicaciones Móviles* y además puede exportarse a Web (`npx expo export --platform web`) si se requiere demostrar React + TypeScript en Kubernetes.

## Talleres de Software Empresarial (3.5) — maestro **Insumos** (MongoDB) en el Backend 1
| Criterio | Pts | Estado | Evidencia |
|---|---|---|---|
| ≥12 campos incluyendo 4 de auditoría (fecha y hora) | 0.5 | ✅ | `model/Insumo.java`: 14 campos (10 funcionales + 4 auditoría: `created_at, updated_at, deleted_at, restored_at`). Frontend Angular: modal de inspección de auditoría. |
| Registrar y editar (Swagger OpenAPI) | 1 | ✅ | Probado y documentado en Swagger UI (`POST` y `PUT /api/insumos`); UI Angular formulario reactivo. |
| Eliminar y restaurar | 1 | ✅ | Pasos probados en Swagger (`PATCH /eliminar` y `/restaurar`). Solo se elimina con **stock = 0**. Botones eliminar/restaurar en Web y Móvil. |
| Importar (≥10) y exportar (≥10) | 1 | ✅ | Backend: `/api/insumos/importar/{csv,excel}` y `/exportar/{excel,pdf}` en Swagger. UI Angular: modal Drag&Drop para CSV/XLSX y descarga directa de Excel/PDF. `insumos.xlsx` (15 registros). |


## Desarrollo de Aplicaciones Móviles (3.5) — `ASE251S4_T05-mobile`
La app cubre **todos los módulos del Backend 1** (3 maestros + 3 transacciones), login JWT y el dashboard analítico.

| Criterio | Pts | Estado | Evidencia |
|---|---|---|---|
| Estructura de carpetas | 1 | ✅ | `src/{app,modules,services,components,context,hooks,config,theme,utils}` |
| Conexión a BD vía *service* que consume la API | 1 | ✅ | `src/services/apiClient.ts` + `crudService.ts` |
| Modificar y eliminar un registro | 0.5 | ✅ | Detalle → **Editar** / **Eliminar** / **Restaurar** en los 6 módulos |
| Lista de 10 registros de la BD y registro por formulario | 1 | ✅ | Insumos (15+), Parcelas (15), Usuarios (57) + formularios con validaciones |

## Gestión de Base de Datos (3.5)
| Criterio | Pts | Estado | Evidencia |
|---|---|---|---|
| Describir y explicar el versionamiento de la persistencia políglota | 1 | ✅ | `docs/PERSISTENCIA_POLIGLOTA.md` §2 + `ASE251S4_T05-db` (V001/V002, `schema_changes`, checksums) |
| Implementar persistencia políglota SQL Server + MongoDB | 1 | ✅ | `config/DatabaseConfig.java` (R2DBC + Reactive Mongo) |
| CRUD interactuando maestros (Mongo) con transacciones (SQL Server) | 1.5 | ✅ | `docs/PERSISTENCIA_POLIGLOTA.md` §3 (actividades ↔ insumos, asignaciones ↔ usuarios, cosechas ↔ parcelas) |

## Proyectos de Innovación Tecnológica (2.5) — `ASE251S4_T05-be-analitico`
| Criterio | Pts | Estado | Evidencia |
|---|---|---|---|
| Cumplimiento de la arquitectura del Backend Analítico | 0.5 | ✅ | `app/{config,database,models,repositories,routes,schemas,services,static}`, `tests/`, `.env.example`, `.gitignore`, `README.md`, `requirements.txt`; Python + Flask + **Pandas** |
| Figma: dashboard por sección (1 por estudiante) con ≥3 cards, 1 circular, 1 barras, 1 tabla | 0.5 | 🟡 | Diseñar en Figma usando la tabla de abajo. Referencia visual funcionando: `http://localhost:5000/dashboard` |
| Figma: dashboard general | 0.5 | 🟡 | Igual, vista "Dashboard General" |
| 6 indicadores funcionales por estudiante, probados y documentados | 1 | ✅ | 18 endpoints + `GET /indicadores` documentados y probados en Swagger BE2 (`/apidocs`); `pytest` (26 pruebas) |

### Guía para el Figma (cada sección cumple 3 cards + circular + barras + tabla)
| Sección | Cards | Circular | Barras | Tabla |
|---|---|---|---|---|
| **Ana — Cosechas** | Total cosechas, Kilos óptimos, Kilos merma, Eficiencia % (A1) | Óptimo vs merma (A2) | Kilos por cultivo (A3) | Por responsable (A5) / Rendimiento por parcela (A6) |
| **Hugo — Actividades e Insumos** | Actividades, Cumplimiento %, Costo, Valor inventario, Stock crítico (H1, H3) | Valor por tipo de insumo (H4) | Costo por tipo de actividad (H2) | Stock crítico (H5) / Consumo (H6) |
| **Axel — Personal** | Usuarios activos, Asignaciones, Horas, Costo mano de obra (X1) | Personal por rol (X2) | Costo por actividad (X3) | Ranking de trabajadores (X4) |
| **General** | Kilos cosechados, Eficiencia, Valor inventario, Cumplimiento, Costo mano de obra, Usuarios | Distribución de costos operativos | Producción por cultivo | Top 5 insumos consumidos |

---

## Cómo comprobar que todo funciona
- **Prueba integral automática:** `.\probar-todo.ps1` → pruebas unitarias (pytest 26, mvn 35, tsc) + **86 pruebas de punta a punta**. Detalle en `docs/PROBAR_TODO.md`.
- **Prueba manual interactiva vía Swagger:** Revisar la guía paso a paso con payloads en `docs/GUIA_SWAGGER.md`.

## Datos para la demo
- `python scripts/sembrar_demo.py` carga parcelas, cultivos, actividades, asignaciones y cosechas **enlazadas** a insumos/usuarios reales de MongoDB (idempotente).
- Seguridad: por defecto `SECURITY_ENFORCE=false` (el frontend Angular no envía token). Para demostrar autorización, levantar el BE1 con `SECURITY_ENFORCE=true`: sin token → 401, rol no ADMIN eliminando → 403.

## Pendiente para la fase de despliegue
1. Imágenes Docker nuevas (BE1 y BE2 cambiaron) y push a Docker Hub / ECR.
2. Manifiestos Kubernetes: namespace, 3 nodos con `nodeSelector` (frontend / backend / analitico), Deployments, Services, ConfigMap/Secret, Ingress, `ExternalName` a RDS y Mongo.
3. RDS SQL Server + ejecutar V001/V002; MongoDB en EC2 o Atlas.
4. Configurar endpoints públicos de Swagger y `EXPO_PUBLIC_API_URL` en la app móvil.
