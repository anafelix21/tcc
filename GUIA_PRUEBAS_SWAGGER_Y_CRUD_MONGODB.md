# Manual Exhaustivo de Pruebas en Swagger y Operaciones CRUD en MongoDB
**Proyecto:** AgroPacayales S.A.C.  
**Arquitectura:** Microservicios y Cómputo Políglota sobre Kubernetes K3s (AWS)  
**Persistencia:** MongoDB 8.0 (NoSQL) + Amazon RDS SQL Server 2022 (R2DBC)  
**Backend:** Spring Boot 3.4 WebFlux (Reactivo Asíncrono) — Puerto NodePort: `30001`

---

## Índice General

1. [Fundamentos Arquitectónicos: ¿Por qué se diseñó así?](#1-fundamentos-arquitectónicos-por-qué-se-diseñó-así)
2. [Acceso a Swagger UI del Backend 1](#2-acceso-a-swagger-ui-del-backend-1)
3. [Colección de Payloads JSON para Swagger UI](#3-colección-de-payloads-json-para-swagger-ui)
   - 3.1. [Módulo de Parcelas (MongoDB: `plots`)](#31-módulo-de-parcelas-mongodb-plots)
   - 3.2. [Módulo de Insumos Agrícolas (MongoDB: `supplies`)](#32-módulo-de-insumos-agrícolas-mongodb-supplies)
   - 3.3. [Módulo de Usuarios y Personal (MongoDB: `users`)](#33-módulo-de-usuarios-y-personal-mongodb-users)
   - 3.4. [Módulo de Cosechas (SQL Server: `/api/harvest`)](#34-módulo-de-cosechas-sql-server-apiharvest)
   - 3.5. [Módulo de Actividades Agrícolas (SQL Server: `/api/actividades-cultivos`)](#35-módulo-de-actividades-agrícolas-sql-server-apiactividades-cultivos)
   - 3.6. [Módulo de Asignaciones (SQL Server: `/api/asignaciones-trabajadores`)](#36-módulo-de-asignaciones-sql-server-apiasignaciones-trabajadores)
4. [Operaciones CRUD Directas en MongoDB (`mongosh`)](#4-operaciones-crud-directas-en-mongodb-mongosh)
   - 4.1. [Conexión y Contexto de la Base de Datos](#41-conexión-y-contexto-de-la-base-de-datos)
   - 4.2. [CRUD Completo: Colección `plots` (Parcelas)](#42-crud-completo-colección-plots-parcelas)
   - 4.3. [CRUD Completo: Colección `supplies` (Insumos)](#43-crud-completo-colección-supplies-insumos)
   - 4.4. [CRUD Completo: Colección `users` (Usuarios)](#44-crud-completo-colección-users-usuarios)
5. [Guía de Integración con App Móvil (Expo React Native)](#5-guía-de-integración-con-app-móvil-expo-react-native)

---

## 1. Fundamentos Arquitectónicos: ¿Por qué se diseñó así?

### 1.1. ¿Por qué Persistencia Políglota (MongoDB + SQL Server)?
- **MongoDB (`plots`, `supplies`, `users`, `field_records`):**
  - **Flexibilidad de Esquema:** Los lotes agrícolas varían drásticamente en su caracterización edafológica (pH, textura, materia orgánica) y en sus redes de riego (caudal en L/h, tipos de válvula). Forzar estos datos en tablas relacionales causaría dispersión en múltiples tablas intermedias con `JOINs` innecesarios.
  - **Subdocumentos Embebidos:** Al consultar una parcela, el frontend y la app móvil obtienen en **una sola lectura atómica** la información del terreno, sus condiciones de suelo y su sistema de riego tecnificado sin sobrecargar la red.
- **SQL Server (`harvests`, `activities`, `plot_assignments`, `crops`):**
  - **Atomicidad y Consistencia Financiera (ACID):** Las cosechas implican balances de masa (kilos óptimos vs. merma) y las actividades generan costos devengados de insumos y mano de obra. Un motor relacional con soporte transaccional garantiza que nunca exista una cosecha registrada sin sus detalles o con cálculos inconsistentes.

### 1.2. ¿Por qué Spring WebFlux con R2DBC y Reactive MongoDB?
- A diferencia de los servidores tradicionales basados en hilos bloqueantes (Spring MVC + Tomcat tradicional donde cada petición consume un hilo de 1 MB de stack), **Spring WebFlux opera sobre Netty con el bucle de eventos (Event Loop)**.
- Permite atender miles de peticiones simultáneas desde el Frontend Web y los Celulares con un consumo de memoria mínimo (~250 MB para toda la JVM).
- Los métodos retornan **`Mono<T>`** (0 o 1 elemento) para operaciones puntuales y **`Flux<T>`** (flujo de 0 a N elementos) para listados no bloqueantes.

### 1.3. ¿Por qué en MongoDB se usa `_id` y en el JSON se ve `id`?
- En MongoDB, la clave primaria inmutable y por defecto indexada es **`_id`**.
- En la clase Java `Parcela.java`, el atributo se anota con `@Id private String id;`.
- **Spring Data MongoDB** traduce automáticamente el campo `_id` de la base de datos al atributo `id` del objeto Java, y **Jackson** lo serializa como `"id": "PARC-GEN-213"` en el JSON.
- **Conclusión crítica:** Si buscas en Swagger o en tu frontend, consultas por `id`. Pero si abres la consola `mongosh`, debes filtrar por `_id`:
  ```javascript
  db.plots.find({ _id: "PARC-GEN-213" }) // Correcto
  db.plots.find({ id: "PARC-GEN-213" })  // Incorrecto (devuelve vacío)
  ```

---

## 2. Acceso a Swagger UI del Backend 1

El backend expone su especificación OpenAPI 3.0 mediante Swagger UI directamente a través del **NodePort 30001** de Kubernetes.

- **URL de Swagger UI:**
  ```text
  http://<IP_PUBLICA_AWS>:30001/webjars/swagger-ui/index.html
  ```
  *(Reemplaza `<IP_PUBLICA_AWS>` por la IP elástica o pública de tu nodo Master/Worker, por ejemplo: `http://13.218.34.30:30001/webjars/swagger-ui/index.html`)*.

---

## 3. Colección de Payloads JSON para Swagger UI

A continuación se detallan los JSONs exactos, validados contra las anotaciones `@Valid`, `@NotNull`, `@NotBlank` y los esquemas `$jsonSchema` de la base de datos.

---

### 3.1. Módulo de Parcelas (MongoDB: `plots`)

Controlador: `ParcelaController` | Ruta Base: `/api/parcelas`

#### A) `POST /api/parcelas` — Crear Nueva Parcela
> **¿Por qué este JSON?** Cumple con la regla de negocio que exige identificación por zona (`PARC-NOR-...`), mínimo 0.1 hectáreas, tipos de suelo estandarizados, y el modelado embebido de condiciones edáficas y sistema de riego.

```json
{
  "id": "PARC-NOR-999",
  "nombre": "Sector Norte - Lote Experimental 999",
  "ubicacion": "Fundo AgroPacayales, Km 118 Panamericana Sur",
  "areaHectareas": 8.50,
  "hectareas": 8.50,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Carlos Mendoza",
  "estadoRiego": "En Proceso",
  "cultivoActual": "Palta Hass Exportación",
  "produccionEstimada": "45 toneladas",
  "fechaUltimaSiembra": "2026-03-15",
  "observaciones": "Lote acondicionado para validación de riego por pulso y micronutrientes.",
  "enUso": true,
  "estado": true,
  "condicionesEdaficas": {
    "textura": "Franco Arenoso",
    "phPromedio": 6.8,
    "materiaOrganicaPct": 2.45
  },
  "sistemaRiego": {
    "tipo": "Goteo",
    "caudalLph": 1.75,
    "sectorValvula": "VALV-EXP-01"
  }
}
```

#### B) `PUT /api/parcelas/{id}` — Actualizar Parcela Existente
> **Parámetro URL:** `id` = `PARC-NOR-999`

```json
{
  "id": "PARC-NOR-999",
  "nombre": "Sector Norte - Lote Experimental 999 (Actualizado)",
  "ubicacion": "Fundo AgroPacayales, Km 118 Panamericana Sur",
  "areaHectareas": 8.50,
  "hectareas": 8.50,
  "tipoSuelo": "Franco Arenoso",
  "responsable": "Ing. Carlos Mendoza",
  "estadoRiego": "Completo",
  "cultivoActual": "Palta Hass Exportación Calibre 12",
  "produccionEstimada": "50 toneladas",
  "fechaUltimaSiembra": "2026-03-15",
  "observaciones": "Riego presurizado al 100% de operatividad técnica.",
  "enUso": true,
  "estado": true,
  "condicionesEdaficas": {
    "textura": "Franco Arenoso",
    "phPromedio": 6.9,
    "materiaOrganicaPct": 2.60
  },
  "sistemaRiego": {
    "tipo": "Goteo",
    "caudalLph": 2.10,
    "sectorValvula": "VALV-EXP-01"
  }
}
```

#### C) `PATCH /api/parcelas/{id}/eliminar` — Desactivación Lógica
> **Parámetro URL:** `id` = `PARC-NOR-999`  
> **Efecto:** Cambia `estado: false` y `enUso: false` en MongoDB registrando fecha en `deleted_at`.

---

### 3.2. Módulo de Insumos Agrícolas (MongoDB: `supplies`)

Controlador: `InsumoController` | Ruta Base: `/api/insumos`

#### A) `POST /api/insumos` — Registrar Nuevo Insumo
> **¿Por qué este JSON?** El backend valida que el identificador siga el estándar `INS-[CAT]-[NUM]`, que el precio sea mayor a 0, y que la categoría pertenezca a la lista autorizada (`FERTILIZANTE`, `PESTICIDA`, `HERBICIDA`, etc.).

```json
{
  "id": "INS-FERT-999",
  "nombre": "Nitrato de Calcio Grado Invernadero",
  "descripcion": "Fertilizante 100% soluble en agua de alta pureza para fertirriego tecnificado.",
  "precio": 185.50,
  "stock": 120,
  "tipoInsumo": "FERTILIZANTE",
  "unidadMedida": "saco",
  "proveedor": "Yara Perú S.A.",
  "presentacion": "Saco valvulado de 25 kg",
  "estado": true
}
```

#### B) `PUT /api/insumos/{id}` — Actualizar Precio y Stock de Insumo
> **Parámetro URL:** `id` = `INS-FERT-999`

```json
{
  "id": "INS-FERT-999",
  "nombre": "Nitrato de Calcio Grado Invernadero Plus",
  "descripcion": "Fertilizante soluble enriquecido con microelementos quelatados.",
  "precio": 195.00,
  "stock": 150,
  "tipoInsumo": "FERTILIZANTE",
  "unidadMedida": "saco",
  "proveedor": "Yara Perú S.A.",
  "presentacion": "Saco valvulado de 25 kg",
  "estado": true
}
```

#### C) `DELETE /api/insumos/{id}` — Eliminación Controlada
> **Regla de Negocio Crítica:** Si el insumo tiene `stock > 0`, el backend responderá con error `400 Bad Request` indicando: *"Solo se puede eliminar un insumo con stock 0"*. Primero debes actualizar el stock a 0 con el PUT antes de eliminarlo.

---

### 3.3. Módulo de Usuarios y Personal (MongoDB: `users`)

Controlador: `UsuarioController` | Ruta Base: `/api/usuarios`

#### A) `POST /api/usuarios` — Crear Nuevo Usuario Institucional
> **¿Por qué este JSON?** Contraseña protegida, validación estricta de regex en el correo electrónico y control de roles agronómicos autorizados (`ADMIN`, `SUPERVISOR`, `AGRONOMO`, `TECNICO`, `OPERARIO`).

```json
{
  "id": "USR-AGR-999",
  "nombre": "Mariana",
  "apellido": "Salazar",
  "correo": "mariana.salazar999@agropacayales.com",
  "password": "Password123!",
  "rol": "AGRONOMO",
  "fechaNacimiento": "1993-04-18",
  "fechaContratacion": "2026-02-01",
  "estado": true
}
```

---

### 3.4. Módulo de Cosechas (SQL Server: `/api/harvest`)

Controlador: `HarvestController` | Ruta Base: `/api/harvest`

#### A) `POST /api/harvest/registrar` — Registrar Cosecha con Detalle Relacional
> **¿Por qué este JSON?** En una sola transacción ACID en SQL Server se guarda la cabecera en `harvests` y cada renglón en `harvest_details`. El backend calcula de manera atómica `totalKilos = kilosOptimos + kilosMerma`.

```json
{
  "responsable": "Ing. Ana Félix",
  "fechaCosecha": "2026-10-26",
  "detalles": [
    {
      "idCultivo": 1,
      "kilosOptimos": 4850.50,
      "kilosMerma": 149.50
    },
    {
      "idCultivo": 2,
      "kilosOptimos": 3200.00,
      "kilosMerma": 80.00
    }
  ]
}
```

#### B) `PUT /api/harvest/eliminar/{id}` — Baja Lógica de Cosecha
> **Parámetro URL:** `id` = `1` (o el ID numérico devuelto en el registro). Cambia el flag de auditoría de la cabecera en SQL Server.

---

### 3.5. Módulo de Actividades Agrícolas (SQL Server: `/api/actividades-cultivos`)

Controlador: `ActividadCultivoController` | Ruta Base: `/api/actividades-cultivos`

#### A) `POST /api/actividades-cultivos` — Registrar Labor de Campo con Insumos
> **¿Por qué este JSON?** Asocia una labor física a un cultivo en SQL Server e integra el consumo de insumos cuyo costo se calcula cruzando el catálogo maestro de MongoDB.

```json
{
  "idCultivo": 1,
  "tipoActividad": "Fertilización",
  "descripcion": "Aplicación de fertilizante foliar balanceado en lote norte previo a floración.",
  "detalles": [
    {
      "idInsumo": "INS-FERT-001",
      "cantidad": 5
    },
    {
      "idInsumo": "INS-PEST-002",
      "cantidad": 2
    }
  ]
}
```

---

### 3.6. Módulo de Asignaciones (SQL Server: `/api/asignaciones-trabajadores`)

Controlador: `AsignacionCabeceraController` | Ruta Base: `/api/asignaciones-trabajadores`

#### A) `POST /api/asignaciones-trabajadores` — Asignar Mano de Obra a Labor
> **¿Por qué este JSON?** Registra las horas máquina/labor ejecutadas y vincula la lista de colaboradores desde MongoDB calculando el devengado total de jornales.

```json
{
  "idActividad": 1,
  "horasTrabajadas": 8.0,
  "observacion": "Jornal de poda sanitaria y deshierbo intensivo en cuartel 3.",
  "detalles": [
    {
      "idUsuario": "USR-OPE-004",
      "costoManoObra": 85.00
    },
    {
      "idUsuario": "USR-OPE-005",
      "costoManoObra": 85.00
    }
  ]
}
```

---

## 4. Operaciones CRUD Directas en MongoDB (`mongosh`)

Para ejecutar auditorías, verificaciones DBA o comprobaciones en vivo, nos conectamos a la instancia EC2 de MongoDB.

### 4.1. Conexión y Contexto de la Base de Datos

1. Ingresa por SSH a la máquina EC2 de MongoDB o ejecuta dentro del pod:
   ```bash
   mongosh "mongodb://admin:Mongo12345@localhost:27017/?authSource=admin"
   ```

2. Selecciona la base de datos oficial del clúster:
   ```javascript
   use agropacayales_db
   ```

3. Verificar colecciones activas:
   ```javascript
   show collections
   // Salida esperada:
   // field_records
   // plots
   // supplies
   // users
   ```

---

### 4.2. CRUD Completo: Colección `plots` (Parcelas)

#### 1. CREATE (Insertar Parcela Directamente)
> **Explicación del porqué:** El validador `$jsonSchema` exige `_id` con patrón `^PARC-[A-Z]{3}-[0-9]{3,}$`. Si intentas guardar un ID como `"123"` o un pH de 25, MongoDB rechazará la operación para proteger la integridad agronómica.

```javascript
db.plots.insertOne({
  _id: "PARC-SUR-888",
  nombre: "Sector Sur - Lote Modelo 888",
  ubicacion: "Fundo AgroPacayales, Km 119 Panamericana Sur",
  area_hectareas: Double(7.25),
  hectareas: Double(7.25),
  tipo_suelo: "Franco Arenoso",
  responsable: "Ing. Ana Félix",
  estado_riego: "Completo",
  cultivo_actual: "Espárrago Verde UC-157",
  produccion_estimada: "60 toneladas métricas",
  en_uso: true,
  estado: true,
  condiciones_edaficas: {
    textura: "Franco Arenoso",
    ph_promedio: Double(6.75),
    materia_organica_pct: Double(2.15)
  },
  sistema_riego: {
    tipo: "Goteo",
    caudal_lph: Double(1.65),
    sector_valvula: "VALV-SUR-08"
  },
  created_at: new Date()
});
```

#### 2. READ (Listar y Consultar con Filtros Avanzados)
```javascript
// A) Buscar por clave primaria exacta (siempre usar _id):
db.plots.find({ _id: "PARC-SUR-888" }).pretty();

// B) Listar las últimas 5 parcelas creadas cronológicamente:
db.plots.find().sort({ $natural: -1 }).limit(5);

// C) Filtrar por subdocumento embebido (Parcelas con pH óptimo entre 6.0 y 7.0):
db.plots.find({
  "condiciones_edaficas.ph_promedio": { $gte: 6.0, $lte: 7.0 }
}, {
  nombre: 1,
  tipo_suelo: 1,
  "condiciones_edaficas.ph_promedio": 1
});

// D) Conteo total de parcelas activas:
db.plots.countDocuments({ estado: true });
```

#### 3. UPDATE (Actualizar Datos y Subdocumentos Embebidos)
> **Explicación del porqué:** Con `$set` podemos modificar propiedades anidadas como `"sistema_riego.caudal_lph"` sin tener que reescribir todo el documento, optimizando el ancho de banda del motor NoSQL.

```javascript
db.plots.updateOne(
  { _id: "PARC-SUR-888" },
  {
    $set: {
      responsable: "Ing. Carlos Mendoza",
      "sistema_riego.caudal_lph": Double(2.20),
      "sistema_riego.sector_valvula": "VALV-SUR-08B",
      updated_at: new Date()
    }
  }
);
```

#### 4. DELETE (Baja Lógica y Eliminación Física)
```javascript
// A) Baja Lógica (Estándar corporativo AgroPacayales: no se pierde trazabilidad):
db.plots.updateOne(
  { _id: "PARC-SUR-888" },
  {
    $set: {
      estado: false,
      en_uso: false,
      deleted_at: new Date()
    }
  }
);

// B) Eliminación Física (Limpieza de pruebas):
db.plots.deleteOne({ _id: "PARC-SUR-888" });
```

---

### 4.3. CRUD Completo: Colección `supplies` (Insumos)

#### 1. CREATE
```javascript
db.supplies.insertOne({
  _id: "INS-PEST-888",
  nombre: "BioInsecticida Extracto de Neem 100 EC",
  descripcion: "Control biológico orgánico contra trips y mosca blanca en frutales.",
  precio: Double(145.00),
  stock: NumberInt(80),
  tipo_insumo: "PESTICIDA",
  unidad_medida: "L",
  proveedor: "Biogrow Agrícola",
  presentacion: "Envase de 1 Litro",
  estado: true,
  created_at: new Date()
});
```

#### 2. READ
```javascript
// Buscar insumos con stock crítico (menos o igual a 15 unidades):
db.supplies.find(
  { stock: { $lte: 15 } },
  { nombre: 1, stock: 1, unidad_medida: 1, precio: 1 }
).sort({ stock: 1 });
```

#### 3. UPDATE (Aumento o Descuento Atómico de Stock con `$inc`)
> **Explicación del porqué:** El operador `$inc` realiza una operación atómica a nivel de motor. Si dos cosechas o actividades descuentan insumos al mismo milisegundo, `$inc` previene condiciones de carrera (*race conditions*).

```javascript
// Descontar 5 litros del stock por aplicación en campo:
db.supplies.updateOne(
  { _id: "INS-PEST-888" },
  {
    $inc: { stock: -5 },
    $set: { updated_at: new Date() }
  }
);
```

#### 4. DELETE
```javascript
// Eliminar insumo retirado del mercado:
db.supplies.deleteOne({ _id: "INS-PEST-888" });
```

---

### 4.4. CRUD Completo: Colección `users` (Usuarios)

#### 1. CREATE
```javascript
db.users.insertOne({
  _id: "USR-TEC-888",
  nombre: "Rodrigo",
  apellido: "Pacheco",
  correo: "rodrigo.pacheco888@agropacayales.com",
  password: "Password123!",
  rol: "TECNICO",
  fecha_nacimiento: "1998-09-14",
  fecha_contratacion: "2026-03-01",
  estado: true,
  created_at: new Date()
});
```

#### 2. READ
```javascript
// Listar todos los administradores y agrónomos:
db.users.find(
  { rol: { $in: ["ADMIN", "AGRONOMO"] } },
  { nombre: 1, apellido: 1, correo: 1, rol: 1 }
);
```

#### 3. UPDATE
```javascript
// Promover técnico a supervisor:
db.users.updateOne(
  { _id: "USR-TEC-888" },
  {
    $set: {
      rol: "SUPERVISOR",
      updated_at: new Date()
    }
  }
);
```

#### 4. DELETE
```javascript
// Desactivar usuario por cese de labores:
db.users.updateOne(
  { _id: "USR-TEC-888" },
  {
    $set: {
      estado: false,
      deleted_at: new Date()
    }
  }
);
```

---

## 5. Guía de Integración con App Móvil (Expo React Native)

La aplicación móvil en `ASE251S4_T05-mobile` implementa la suite completa de maestros y transacciones sobre **React Native con Expo Router**.

### 5.1. Variables de Entorno en el Celular (`.env`)
En tu archivo local `ASE251S4_T05-mobile/.env`, se configuraron los NodePorts de AWS:
```env
EXPO_PUBLIC_API_URL=http://13.218.34.30:30001/api
EXPO_PUBLIC_ANALYTICS_URL=http://13.218.34.30:30002/api/v1/analytics
```

> **¿Por qué NO usar `localhost` en el móvil?**  
> En un smartphone (o emulador), `localhost` apunta al propio teléfono, donde no existe ningún servidor Java ni Python ejecutándose. Al colocar la IP pública de AWS (`13.218.34.30:30001`), la app hace llamadas de red reales a través de Internet (vía Wi-Fi o datos móviles 4G/5G).

### 5.2. Ejecutar la App en Tu Celular:
```powershell
cd "e:\Nueva carpeta (8)\tcc\ASE251S4_T05-mobile"
npx expo start
```
1. Abre la aplicación **Expo Go** en tu smartphone (Android / iOS).
2. Escanea el código QR que se dibuja en tu terminal de PowerShell.
3. ¡Listo! Todo lo que registres en tu celular se guardará en MongoDB y aparecerá en el Frontend Web inmediatamente.
