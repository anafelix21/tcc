# 📊 Backend Analítico - AgroPacayales (ASE251S4_T05)

Este es el **Backend Analítico (`backend-analitico`)** del proyecto **AgroPacayales**. Está desarrollado en **Python (Flask)** y tiene como propósito principal extraer, procesar, calcular y exponer métricas agronómicas, indicadores clave de rendimiento (KPIs), costos operativos y resúmenes estadísticos cruzando datos entre las dos bases de datos del ecosistema:

1. **MongoDB Atlas (NoSQL):** Entidades maestras (`usuarios`, `insumos`, `parcelas`).
2. **Microsoft SQL Server 2022 (Relacional):** Entidades transaccionales (`cultivos`, `actividad_cultivo`, `detalle_actividad`, `harvest`, `harvest_planting_cycle`, `asignacion_cabecera`, `asignacion_detalle`).

---

## 🏗️ Arquitectura y Estructura en Capas

El backend analítico sigue una arquitectura limpia orientada al dominio agrícola:

```text
ASE251S4_T05-be-analitico/
├── app/
│   ├── config/          # Configuración de variables (.env) y caché en memoria
│   ├── database/        # Conexiones a MongoDB (pymongo) y SQL Server (SQLAlchemy pool)
│   ├── repositories/    # Agregaciones y queries de lectura optimizadas
│   ├── services/        # Reglas de cálculo, consolidación de KPIs y analítica
│   ├── routes/          # Controladores REST con OpenAPI / Swagger interactivo
│   ├── utils/           # Estandarización de respuestas JSON (success/error)
│   └── main.py          # Aplicación principal Flask, CORS y Swagger UI
├── Dockerfile           # Imagen Docker optimizada (Python 3.12-slim + Gunicorn)
├── requirements.txt     # Dependencias del proyecto
├── wsgi.py              # Entrypoint para servidores de producción WSGI
├── .env.example         # Plantilla de variables de entorno
└── README.md            # Documentación completa
```

---

## 🧩 Módulos y Endpoints Analíticos

| Módulo | Endpoint | Base de Datos | Descripción |
| :--- | :--- | :--- | :--- |
| **Dashboard** | `GET /api/v1/analytics/dashboard/kpis` | Híbrido (Mongo + SQL) | Resumen ejecutivo consolidado: hectáreas, cosechas, merma %, actividades y stock crítico. |
| **Cosechas** | `GET /api/v1/analytics/cosechas/resumen` | SQL Server | Total de cosechas, kilos óptimos cosechados, kilos de merma y tasa de merma (%). |
| **Cosechas** | `GET /api/v1/analytics/cosechas/por-cultivo` | SQL Server | Rendimiento agronómico y merma desglosado por cada cultivo (Palta Hass, etc.). |
| **Cosechas** | `GET /api/v1/analytics/cosechas/mensual` | SQL Server | Serie temporal de producción de cosechas agrupada por mes. |
| **Actividades**| `GET /api/v1/analytics/actividades/resumen` | SQL Server | Total de labores agrícolas, tasa de cumplimiento (%) y costo acumulado. |
| **Actividades**| `GET /api/v1/analytics/actividades/por-tipo` | SQL Server | Labores y costos agrupados por tipo (Fumigación, Riego, Fertilización, Poda). |
| **Actividades**| `GET /api/v1/analytics/actividades/insumos-consumidos` | SQL Server | Insumos agrícolas más consumidos en las actividades de campo. |
| **Insumos** | `GET /api/v1/analytics/insumos/resumen` | MongoDB Atlas | Total de insumos registrados, stock físico y valorización económica del almacén. |
| **Insumos** | `GET /api/v1/analytics/insumos/stock-critico` | MongoDB Atlas | Alerta temprana de insumos con stock menor o igual al umbral de seguridad. |
| **Insumos** | `GET /api/v1/analytics/insumos/por-tipo` | MongoDB Atlas | Stock y valorización monetaria por categoría (Fertilizantes, Insecticidas, etc.). |
| **Parcelas** | `GET /api/v1/analytics/parcelas/resumen` | MongoDB Atlas | Total de parcelas, hectáreas cultivadas, parcelas en uso y producción estimada (kg). |
| **Parcelas** | `GET /api/v1/analytics/parcelas/por-suelo` | MongoDB Atlas | Análisis de distribución de hectáreas por tipo de suelo (Arcilloso, Arenoso, etc.). |
| **Personal** | `GET /api/v1/analytics/personal/resumen` | Híbrido (Mongo + SQL) | Personal activo por rol y total de horas hombre / costos de mano de obra en campo. |
| **Health** | `GET /health` | N/A | Healthcheck de monitoreo para Docker y AWS. |

---

## 🚀 Ejecución Local

### 1. Requisitos Previos
* Python 3.10 o superior instalado.
* Conexión a Internet para conectar a MongoDB Atlas o contenedores locales activos.

### 2. Configurar Entorno Virtual y Dependencias
```bash
cd ASE251S4_T05-be-analitico

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# En Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

### 3. Configurar `.env`
Copia el archivo `.env.example` a `.env` y configura los valores correspondientes:
```bash
cp .env.example .env
```

### 4. Iniciar la Aplicación
```bash
python app/main.py
```
El servidor se levantará en:  
👉 **API:** `http://localhost:5000`  
👉 **Documentación Swagger UI:** `http://localhost:5000/apidocs`  

---

## 🐳 Despliegue con Docker y Docker Hub

### 1. Construir la imagen Docker:
```bash
docker build -t anafelixmendoza21/agropacayales-backend-analitico:1.0 .
```

### 2. Probar el contenedor localmente:
```bash
docker run -d --name backend-analitico -p 5000:5000 --env-file .env anafelixmendoza21/agropacayales-backend-analitico:1.0
```

### 3. Subir la imagen a Docker Hub:
```bash
docker push anafelixmendoza21/agropacayales-backend-analitico:1.0
```
