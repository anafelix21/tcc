# Guía de Pruebas con Swagger (Sin Postman) — AgroPacayales Sprint 8

Esta guía documenta cómo evaluar y demostrar el **100% de los requisitos del Sprint 8** utilizando exclusivamente las interfaces interactivas de **Swagger UI / OpenAPI**, sin necesidad de instalar ni usar Postman.

---

## 📌 1. Direcciones de Swagger UI

| Servicio | Motor / Framework | URL interactiva de Swagger | Qué contiene |
|---|---|---|---|
| **Backend 1** | Spring Boot 3 WebFlux (Java 21) | 👉 **[http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)** | Autenticación JWT, Maestros en MongoDB (Insumos, Parcelas, Usuarios) y Transacciones en SQL Server (Cosechas, Actividades, Asignaciones). |
| **Backend 2** | Flask + Flasgger + Pandas (Python) | 👉 **[http://localhost:5000/apidocs](http://localhost:5000/apidocs)** | 18 Indicadores funcionales (Ana, Hugo, Axel), Dashboard General e Ingesta de Eventos de auditoría. |

---

## 🔐 2. Autenticación JWT en Swagger UI (Backend 1)

Si la seguridad está activada (`SECURITY_ENFORCE=true`), o para probar autorización de roles:

### Paso 1: Iniciar sesión
1. En **[http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)**, abrir la sección **Auth-Controller**.
2. Desplegar `POST /api/auth/login`, dar clic en **Try it out** y pegar el siguiente JSON:
```json
{
  "correo": "hugo@agro.com",
  "password": "Password123!"
}
```
3. Clic en **Execute**. La respuesta `200 OK` retornará:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tipo": "Bearer",
  "rol": "ADMIN",
  "correo": "hugo@agro.com"
}
```

### Paso 2: Autorizarse en Swagger
1. Copiar el valor del campo `token`.
2. En la parte superior derecha de la página de Swagger UI, presionar el botón verde **Authorize** (con el candado).
3. En el campo `bearerAuth (http, Bearer)`, pegar el token (o escribir `Bearer <token>`).
4. Clic en **Authorize** y luego en **Close**.
5. ¡Listo! Todas las peticiones subsecuentes enviarán automáticamente la cabecera `Authorization: Bearer <token>`.

---

## 🧪 3. Pruebas de Talleres de Software Empresarial (Maestro Insumos - MongoDB)

Rúbrica: ≥12 campos con 4 de auditoría, registro, edición, eliminación con validación de stock=0, restauración, importación y exportación.

### 3.1 Registrar Insumo (`POST /api/insumos`)
1. Abrir **Insumo-Controller** → `POST /api/insumos`.
2. Clic en **Try it out** y pegar:
```json
{
  "nombre": "Biofertilizante Foliar Sprint8",
  "descripcion": "Fertilizante foliar de alta concentración enriquecido con micronutrientes",
  "precio": 65.50,
  "stock": 40,
  "unidadMedida": "L",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "AgroBio Perú",
  "presentacion": "Galón 4L",
  "estado": true
}
```
3. Clic en **Execute**. 
4. **Validación:** Retorna `201 Created` con 14 campos:
   - 10 datos funcionales (`id`, `nombre`, `descripcion`, `precio`, `stock`, `unidadMedida`, `tipoInsumo`, `proveedor`, `presentacion`, `estado`).
   - 4 campos de auditoría con fecha y hora: `created_at` (lleno), `updated_at` (lleno), `deleted_at` (null), `restored_at` (null).
5. **Copiar el `id` generado** (ejemplo: `67b8...`) para los siguientes pasos.

### 3.2 Editar Insumo (`PUT /api/insumos/{id}`)
1. Desplegar `PUT /api/insumos/{id}`.
2. Ingresar el `id` del insumo en el parámetro del path.
3. Pegar el cuerpo modificado (por ejemplo, actualizando precio o stock a 0):
```json
{
  "nombre": "Biofertilizante Foliar Sprint8 Premium",
  "descripcion": "Fórmula mejorada lista para aplicación",
  "precio": 72.00,
  "stock": 0,
  "unidadMedida": "L",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "AgroBio Perú",
  "presentacion": "Galón 4L",
  "estado": true
}
```
4. Clic en **Execute** → Retorna `200 OK` con `updated_at` actualizado con la fecha y hora de la edición.

### 3.3 Regla de negocio: Eliminación lógica validando Stock = 0 (`PATCH /api/insumos/eliminar/{id}`)
1. **Prueba de rechazo si stock > 0:** Si un insumo tiene stock > 0, Swagger retornará `400 Bad Request` indicando *"No se puede dar de baja un insumo con stock disponible"*.
2. **Prueba de éxito (stock = 0):** Con el insumo editado a `stock: 0`, ejecutar `PATCH /api/insumos/eliminar/{id}`.
3. Retorna `200 OK`, `estado: false` y el campo de auditoría `deleted_at` queda registrado con la fecha y hora actual.
4. Validar en el filtro de inactivos ejecutando `GET /api/insumos/estado/false`.

### 3.4 Restaurar Insumo (`PATCH /api/insumos/restaurar/{id}`)
1. Desplegar `PATCH /api/insumos/restaurar/{id}` e ingresar el `id`.
2. Clic en **Execute** → Retorna `200 OK`, `estado: true` y el campo `restored_at` queda registrado con la fecha y hora actual.

### 3.5 Importación masiva (≥10 registros) (`POST /api/insumos/importar/excel` o `/csv`)
1. Desplegar `POST /api/insumos/importar/excel`.
2. Clic en **Try it out**, seleccionar el archivo `insumos.xlsx` ubicado en la raíz del repositorio (contiene 15 insumos agrícolas válidos).
3. Clic en **Execute** → Retorna `200 OK` con:
```json
{
  "totalRegistros": 15,
  "importados": 15,
  "fallidos": 0,
  "mensaje": "Importación completada con éxito."
}
```

### 3.6 Exportación en Excel y PDF
1. **Excel:** Desplegar `GET /api/insumos/exportar/excel` → Clic en **Execute** → Clic en el enlace **Download file** para descargar el archivo `.xlsx`.
2. **PDF:** Desplegar `GET /api/insumos/exportar/pdf` → Clic en **Execute** → Clic en **Download file** para obtener el reporte formal en PDF.

---

## 🗄️ 4. Pruebas de Gestión de Base de Datos (Persistencia Políglota)

Rúbrica: Maestros en MongoDB interactuando con Transacciones en SQL Server mediante claves lógicas compartidas y control ACID.

### 4.1 Maestro Parcelas en MongoDB (con embedding V002) (`POST /api/parcelas`)
1. Desplegar `POST /api/parcelas`.
2. Pegar el siguiente JSON (valida subdocumentos embebidos exigidos por MongoDB V002):
```json
{
  "codigo": "PARC-DEMO01",
  "nombre": "Lote San Isidro 4",
  "hectareas": 12.5,
  "ubicacion": "Valle Grande Sector Norte",
  "condicionesEdaficas": {
    "tipoSuelo": "Franco Arenoso",
    "ph": 6.8,
    "materiaOrganicaPct": 2.4,
    "drenaje": "Bueno"
  },
  "sistemaRiego": {
    "tipo": "Goteo",
    "caudalLitrosSegundo": 4.5,
    "frecuenciaHoras": 6,
    "eficienciaPct": 92.0
  },
  "estado": true
}
```
3. Clic en **Execute** → Retorna `201 Created` con el ID generado (ej: `PARC-DEMO01` o auto-generado) y subdocumentos embebidos.

---

### 4.2 Transacción Cosechas — Ana Félix (`POST /api/harvest`)
*Persistencia en SQL Server (`harvest` + `harvest_planting_cycle`) vinculada a los cultivos de una parcela.*

1. Desplegar `POST /api/harvest` (o `/api/harvest/registrar`).
2. Pegar:
```json
{
  "idCultivo": 1,
  "fechaCosecha": "2026-10-21",
  "responsable": "Ana Félix",
  "observaciones": "Cosecha de prueba registrada desde Swagger UI",
  "detalles": [
    {
      "idCultivo": 1,
      "kilosOptimos": 4500.0,
      "kilosMerma": 220.0
    }
  ]
}
```
3. Clic en **Execute** → Retorna `201 Created` con la cabecera y el detalle de rendimiento calculados.
4. Para dar de baja: `DELETE /api/harvest/{id}`.
5. Para restaurar: `PUT /api/harvest/restaurar/{id}`.

---

### 4.3 Transacción Actividades de Cultivo — Hugo Fernández (`POST /api/actividades-cultivos`)
*Transacción ACID en SQL Server (`actividad_cultivo` + `detalle_actividad`) que valida en tiempo real la existencia e integridad del insumo en MongoDB.*

1. Desplegar `POST /api/actividades-cultivos`.
2. Primero obtener un `_id` de insumo activo desde `GET /api/insumos`.
3. Pegar:
```json
{
  "idCultivo": 1,
  "tipoActividad": "Fertilización Foliar",
  "descripcion": "Aplicación de fertilizante foliar para floración",
  "fechaProgramada": "2026-10-22",
  "detalles": [
    {
      "idInsumo": "REEMPLAZAR_POR_ID_INSUMO_MONGO",
      "cantidad": 3.0
    }
  ]
}
```
4. Clic en **Execute**.
5. **Comprobación políglota:**
   - Si se envía un `idInsumo` inexistente: Retorna `400 Bad Request` indicando *"El insumo ... no existe en MongoDB"*.
   - Con un insumo real: El backend toma el precio unitario vigente de MongoDB, calcula el subtotal y costo total, y graba la transacción de forma atómica en SQL Server.

---

### 4.4 Transacción Asignaciones de Personal — Axel Huapaya (`POST /api/asignaciones-trabajadores`)
*Transacción en SQL Server que valida al operario en MongoDB (`usuarios._id`) y acumula el costo de mano de obra en la labor.*

1. Desplegar `POST /api/asignaciones-trabajadores`.
2. Obtener un `_id` de usuario operario activo desde `GET /api/usuarios` y un `idActividad` existente.
3. Pegar:
```json
{
  "idActividad": 1,
  "horasTrabajadas": 8,
  "observacion": "Jornada de fertilización completa",
  "detalles": [
    {
      "idUsuario": "REEMPLAZAR_POR_ID_USUARIO_MONGO",
      "costoManoObra": 95.0
    }
  ]
}
```
4. Clic en **Execute** → Valida al trabajador en MongoDB e inserta cabecera y detalle en SQL Server sumando el costo a la actividad.

---

## 📊 5. Pruebas de Proyectos de Innovación Tecnológica (PIT — Backend 2 Analítico)

Abrir Swagger BE2 en: 👉 **[http://localhost:5000/apidocs](http://localhost:5000/apidocs)**

### 5.1 Catálogo Formal de los 18 Indicadores
Desplegar y ejecutar en Swagger o en el navegador:
`GET http://localhost:5000/api/v1/analytics/indicadores`
Devuelve el JSON con los 18 indicadores mapeados a cada estudiante con su código, endpoint y formato visual (cards, barras, circular o tabla).

---

### 5.2 Sección 1: Ana Félix — Cosechas y Rendimiento (6 Indicadores)
| Código | Endpoint en Swagger | Formato Visual | Qué demuestra |
|---|---|---|---|
| **A1** | `GET /api/v1/analytics/cosechas/resumen` | Cards | Total cosechas, kilos óptimos, merma, kilos totales y % de eficiencia. |
| **A2** | `GET /api/v1/analytics/cosechas/calidad` | Gráfico circular | Proporción exacta entre producto óptimo y merma. |
| **A3** | `GET /api/v1/analytics/cosechas/por-cultivo` | Gráfico de barras | Kilos cosechados agrupados por cultivo. |
| **A4** | `GET /api/v1/analytics/cosechas/mensual` | Serie temporal | Evolución de producción mes a mes. |
| **A5** | `GET /api/v1/analytics/cosechas/por-responsable` | Tabla | Rendimiento y mermas por cada encargado de cosecha. |
| **A6** | `GET /api/v1/analytics/cosechas/rendimiento-parcela` | Tabla políglota | Cruce de kilos (SQL Server) con hectáreas de parcela (MongoDB) para calcular **Kg/Ha**. |

---

### 5.3 Sección 2: Hugo Fernández — Actividades e Insumos (6 Indicadores)
| Código | Endpoint en Swagger | Formato Visual | Qué demuestra |
|---|---|---|---|
| **H1** | `GET /api/v1/analytics/campo/actividades/resumen` | Cards | Total labores agrícolas, completadas, pendientes, tasa de cumplimiento y costo acumulado. |
| **H2** | `GET /api/v1/analytics/campo/actividades/por-tipo` | Gráfico de barras | Costo y cantidad de labores por tipo (Fumigación, Riego, Fertilización, Poda). |
| **H3** | `GET /api/v1/analytics/campo/insumos/resumen` | Cards | Insumos registrados, unidades en stock, valorización monetaria total y stock crítico (parámetro `limite`). |
| **H4** | `GET /api/v1/analytics/campo/insumos/por-tipo` | Gráfico circular | Porcentaje de valor de inventario por categoría (FERTILIZANTE, PESTICIDA, etc.). |
| **H5** | `GET /api/v1/analytics/campo/insumos/stock-critico` | Tabla | Insumos con existencia menor o igual al umbral especificado. |
| **H6** | `GET /api/v1/analytics/campo/insumos/consumo` | Tabla políglota | Cruce de consumo en actividades (SQL Server) con catálogo maestro (MongoDB). |

---

### 5.4 Sección 3: Axel Huapaya — Personal y Mano de Obra (6 Indicadores)
| Código | Endpoint en Swagger | Formato Visual | Qué demuestra |
|---|---|---|---|
| **X1** | `GET /api/v1/analytics/personal/resumen` | Cards | Personal activo vs inactivo, asignaciones, horas acumuladas y costo de mano de obra. |
| **X2** | `GET /api/v1/analytics/personal/por-rol` | Gráfico circular | Proporción de la nómina por rol (ADMIN, INGENIERO, OPERARIO). |
| **X3** | `GET /api/v1/analytics/personal/mano-obra-por-actividad` | Gráfico de barras | Inversión en jornales según el tipo de actividad agrícola. |
| **X4** | `GET /api/v1/analytics/personal/ranking-trabajadores` | Tabla políglota | Cruce de jornales (SQL Server) con nombres de usuario (MongoDB) con parámetro `top`. |
| **X5** | `GET /api/v1/analytics/personal/mensual` | Serie temporal | Evolución mensual de horas y costo de jornales. |
| **X6** | `GET /api/v1/analytics/personal/parcelas-por-suelo` | Gráfico de barras | Análisis de hectáreas en MongoDB agrupadas por tipo de suelo embebido. |

---

### 5.5 Dashboard General e Ingesta de Eventos
1. **Dashboard General integrado:**
   - `GET /api/v1/analytics/dashboard/general`
   - Retorna en una sola llamada los KPIs consolidados de las 3 áreas: tarjetas, distribución de costos operativos (gráfico circular), producción por cultivo (barras) y top 5 insumos consumidos (tabla).
2. **Ingesta de Eventos / Logs:**
   - Desplegar `POST /api/v1/analytics/eventos`.
   - Probar con:
```json
{
  "tipo_evento": "CREACION",
  "entidad": "INSUMO",
  "entidad_id": "INS-TEST-001",
  "usuario": "hugo@agro.com",
  "detalle": {
    "origen": "Swagger UI",
    "accion": "Prueba manual de auditoria"
  }
}
```
   - Clic en **Execute** → Retorna `201 Created` confirmando que el evento quedó registrado en `eventos_negocio` de MongoDB.

---

## 📋 6. Resumen de Cumplimiento de Rúbrica con Swagger

| Curso / Rúbrica | Criterio | Demostración en Swagger |
|---|---|---|
| **Software Empresarial** (3.5 pts) | Insumo ≥12 campos + 4 auditoría | `POST /api/insumos` retorna los 14 campos con timestamps. |
| **Software Empresarial** (3.5 pts) | Registrar y Editar | `POST` y `PUT /api/insumos` en Swagger BE1. |
| **Software Empresarial** (3.5 pts) | Eliminar y Restaurar (stock = 0) | `PATCH /api/insumos/eliminar/{id}` y `/restaurar/{id}`. |
| **Software Empresarial** (3.5 pts) | Importar y Exportar | `POST /importar/excel` y `GET /exportar/{excel,pdf}` con descarga directa desde Swagger. |
| **Gestión de Base de Datos** (3.5 pts) | Persistencia Políglota | Mongo (maestros) + SQL Server (transacciones). |
| **Gestión de Base de Datos** (3.5 pts) | CRUD interactuando motores | `POST /api/actividades-cultivos` y `/api/asignaciones-trabajadores` validando contra Mongo. |
| **Innovación Tecnológica (PIT)** (2.5 pts) | 6 indicadores funcionales por estudiante | 18 endpoints documentados y ejecutables en Swagger BE2 (`/apidocs`). |
| **Orquestadores y Automatización** (3.5 pts) | Endpoints documentados en Swagger | OpenAPI 3.0 en BE1 (`/swagger-ui.html`) y Flasgger en BE2 (`/apidocs`). |
