# 📊 Backend 2 Analítico — AgroPacayales (ASE251S4_T05_ba)

Backend analítico en **Python + Flask + Pandas**. Hace la **ingesta y el procesamiento** de los datos del ecosistema y expone **18 indicadores (6 por estudiante)**, un **dashboard general** y la **ingesta de eventos/logs** que envía el Backend 1 (Spring Boot).

| Base de datos | Uso | Colecciones / tablas |
| :--- | :--- | :--- |
| **MongoDB** (Atlas o EC2, puerto 27017) | Maestros + eventos | `insumos`, `parcelas`, `usuarios`, `eventos_negocio` |
| **SQL Server** (Amazon RDS, puerto 1433) | Transacciones | `harvest`, `harvest_planting_cycle`, `cultivos`, `actividad_cultivo`, `detalle_actividad`, `asignacion_cabecera`, `asignacion_detalle` |

## 🏗️ Estructura (arquitectura definida)

```text
ASE251S4_T05_ba/
├── app/
│   ├── config/         # settings (.env) y caché
│   ├── database/       # conexión MongoDB (pymongo) y SQL Server (SQLAlchemy) -> DataFrames
│   ├── models/         # mapeo de campos Mongo/SQL y normalización de tipos con Pandas
│   ├── repositories/   # lectura de maestros (Mongo), transacciones (SQL) y eventos
│   ├── routes/         # Blueprints REST documentados con Swagger
│   ├── schemas/        # validación de entradas con Pydantic (eventos, query params)
│   ├── services/       # cálculo de indicadores con Pandas (groupby, merge, agregaciones)
│   ├── static/         # dashboard.html (prototipo que consume la API)
│   └── main.py         # app Flask, CORS, Swagger, manejo de errores
├── tests/              # pytest con datos simulados (no requiere BD)
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── requirements.txt
└── wsgi.py
```

> **Nota técnica:** Spring Data guarda `BigDecimal` como **texto** en MongoDB (`"precio": "85.5"`) y los campos en *snake_case* (`tipo_insumo`, `area_hectareas`). Los modelos (`app/models`) convierten esos tipos con `pd.to_numeric` antes de calcular.

## 📈 Indicadores por estudiante

Base: `/api/v1/analytics`

### Sección 1 — Ana Félix: Cosechas y Rendimiento
| # | Endpoint | Visual | Fuente |
|---|---|---|---|
| A1 | `GET /cosechas/resumen` | Cards | SQL Server |
| A2 | `GET /cosechas/calidad` | Gráfico circular | SQL Server |
| A3 | `GET /cosechas/por-cultivo` | Gráfico de barras | SQL Server |
| A4 | `GET /cosechas/mensual` | Línea / barras | SQL Server |
| A5 | `GET /cosechas/por-responsable` | Tabla | SQL Server |
| A6 | `GET /cosechas/rendimiento-parcela` | Tabla | **SQL + Mongo** |
| — | `GET /cosechas/seccion` | Todo el dashboard de la sección | |

### Sección 2 — Hugo Fernández: Actividades de Campo e Insumos
| # | Endpoint | Visual | Fuente |
|---|---|---|---|
| H1 | `GET /campo/actividades/resumen` | Cards | SQL Server |
| H2 | `GET /campo/actividades/por-tipo` | Gráfico de barras | SQL Server |
| H3 | `GET /campo/insumos/resumen?limite=20` | Cards | MongoDB |
| H4 | `GET /campo/insumos/por-tipo` | Gráfico circular | MongoDB |
| H5 | `GET /campo/insumos/stock-critico?limite=20` | Tabla | MongoDB |
| H6 | `GET /campo/insumos/consumo?top=10` | Tabla | **SQL + Mongo** |
| — | `GET /campo/seccion` | Todo el dashboard de la sección | |

### Sección 3 — Axel Huapaya: Personal y Mano de Obra
| # | Endpoint | Visual | Fuente |
|---|---|---|---|
| X1 | `GET /personal/resumen` | Cards | SQL + Mongo |
| X2 | `GET /personal/por-rol` | Gráfico circular | MongoDB |
| X3 | `GET /personal/mano-obra-por-actividad` | Gráfico de barras | SQL Server |
| X4 | `GET /personal/ranking-trabajadores?top=10` | Tabla | **SQL + Mongo** |
| X5 | `GET /personal/mensual` | Línea / barras | SQL Server |
| X6 | `GET /personal/parcelas-por-suelo` | Barras | MongoDB |
| — | `GET /personal/seccion` | Todo el dashboard de la sección | |

### Dashboard general, ingesta y monitoreo
| Endpoint | Descripción |
|---|---|
| `GET /dashboard/general` | Cards + circular (costos) + barras (cosecha por cultivo) + tabla (consumo de insumos) |
| `GET /indicadores` | Catálogo de los 18 indicadores |
| `POST /eventos` | Ingesta de un evento de negocio (lo llama el Backend 1) |
| `POST /eventos/lote` | Ingesta masiva de eventos |
| `GET /eventos/resumen` | Eventos procesados por tipo, entidad y día |
| `GET /eventos/ultimos?top=20` | Log de actividad reciente |
| `GET /health` | Healthcheck (Kubernetes) con estado de MongoDB y SQL Server |
| `GET /apidocs` | Swagger UI |
| `GET /dashboard` | Prototipo visual del dashboard (consume la API) |

## 🚀 Ejecución local

```bash
python -m venv venv
venv\Scripts\activate          # Windows  (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # editar credenciales
python wsgi.py
```

- API: http://localhost:5000
- Swagger: http://localhost:5000/apidocs
- Dashboard prototipo: http://localhost:5000/dashboard

## 🧪 Pruebas

```bash
python -m pytest -q
```

Las pruebas usan datos simulados de SQL Server y MongoDB y validan los 18 indicadores, los cruces entre las dos bases, el dashboard general, la ingesta de eventos y los errores de validación (422).

## 🐳 Docker

```bash
docker build -t anafelixmendoza21/agropacayales-backend-analitico:2.0 .
docker run -d -p 5000:5000 --env-file .env anafelixmendoza21/agropacayales-backend-analitico:2.0
```
