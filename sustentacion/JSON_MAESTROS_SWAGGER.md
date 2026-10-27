# 🧾 JSON de las Tablas Maestras (MongoDB) — Pruebas en Swagger / Postman

Para el criterio de **Talleres de Software Empresarial** (registrar, editar, eliminar, restaurar, importar y exportar el maestro CRUD en MongoDB).

✅ **Todos estos JSON se probaron contra el backend real** (imagen Docker del Backend 1 + MongoDB 8): registrar → editar → eliminar → restaurar → importar → exportar funcionó en los **3 maestros**.

| Maestro | Responsable | Ruta base | Campos (mín. 12) |
| :-- | :-- | :-- | :-- |
| 🌾 **Parcelas** | **Ana Félix** | `/api/parcelas` | 20 + 6 embebidos |
| 🧪 Insumos | Hugo Fernández | `/api/insumos` | 14 |
| 👩‍🌾 Usuarios | Axel Huapaya | `/api/usuarios` | 13 |

---

## 0. Cómo usar Swagger (Backend 1)

| Despliegue | URL de Swagger |
| :-- | :-- |
| Kubernetes | `http://<IP k8s-node-backend>:30001/swagger-ui.html` |
| Taller Cloud | `http://<IP cc-backends>:8081/swagger-ui.html` |
| Postman | Importar `http://<IP>:<puerto>/api-docs` |

1. Abrir el grupo del maestro: **Parcela-Controller**, **Insumo-Controller** o **Usuario-Controller** (cosechas: **Harvest-Controller**) → elegir la operación → **Try it out**.
2. Pegar el JSON en **Request body** → **Execute**.
3. Copiar el **`id`** de la respuesta: se usa para editar, eliminar y restaurar.

**Los 4 campos de auditoría (fecha y hora)** se llenan solos. No se envían en el JSON:

| Campo | Se llena al… | Formato de respuesta |
| :-- | :-- | :-- |
| `createdAt` | Registrar | `27/10/2026 11:01:14` |
| `updatedAt` | Editar | `27/10/2026 11:01:17` |
| `deletedAt` | Eliminar | `27/10/2026 11:01:17` |
| `restoredAt` | Restaurar | `27/10/2026 11:01:27` |

El **`id`** también lo genera el sistema con un código legible: `PARC-GEN-747`, `INS-FERT-852`, `USR-SUP-306`.

---

## 1. 🌾 PARCELAS (Ana Félix) — `/api/parcelas`

### Campos

| # | Campo | Tipo | Obligatorio | Regla |
| :-: | :-- | :-- | :-: | :-- |
| 1 | `nombre` | texto | ✅ | máx. 100 |
| 2 | `ubicacion` | texto | | máx. 200 |
| 3 | `areaHectareas` | decimal | | mín. 0.1 |
| 4 | `tipoSuelo` | texto | | máx. 80 |
| 5 | `responsable` | texto | | máx. 100 |
| 6 | `estadoRiego` | texto | | máx. 50 |
| 7 | `fechaUltimaSiembra` | fecha `AAAA-MM-DD` | | |
| 8 | `produccionEstimada` | texto | | máx. 100 |
| 9 | `cultivoActual` | texto | | máx. 100 |
| 10 | `observaciones` | texto | | |
| 11 | `hectareas` | decimal | | |
| 12 | `condicionesEdaficas` | **objeto embebido** | | `textura`, `phPromedio`, `materiaOrganicaPct` |
| 13 | `sistemaRiego` | **objeto embebido** | | `tipo`, `caudalLph`, `sectorValvula` |
| 14 | `enUso` | sí/no | | |
| 15 | `estado` | sí/no | auto | `true` activa · `false` eliminada |
| 16–19 | `createdAt` · `updatedAt` · `deletedAt` · `restoredAt` | fecha y hora | auto | auditoría |

### ➕ Registrar — `POST /api/parcelas`
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
  "observaciones": "Parcela de demostración para la evaluación",
  "hectareas": 8.5,
  "condicionesEdaficas": { "textura": "Franco arenoso", "phPromedio": 6.8, "materiaOrganicaPct": 2.4 },
  "sistemaRiego": { "tipo": "Goteo", "caudalLph": 4.5, "sectorValvula": "V-12" }
}
```
➡️ Responde con el `id` (ej. `PARC-GEN-747`), `estado: true` y `createdAt`.

### ✏️ Editar — `PUT /api/parcelas/{id}`
```json
{
  "nombre": "Parcela Demo Ana",
  "ubicacion": "Valle de Cañete - Sector B",
  "areaHectareas": 8.5,
  "tipoSuelo": "Franco",
  "responsable": "Ana Félix",
  "estadoRiego": "Parcial (Aspersión)",
  "fechaUltimaSiembra": "2026-08-15",
  "produccionEstimada": "30 toneladas",
  "cultivoActual": "Mandarina",
  "observaciones": "Parcela de demostración para la evaluación",
  "hectareas": 8.5,
  "condicionesEdaficas": { "textura": "Franco arenoso", "phPromedio": 6.8, "materiaOrganicaPct": 2.4 },
  "sistemaRiego": { "tipo": "Goteo", "caudalLph": 4.5, "sectorValvula": "V-12" }
}
```
➡️ Cambia cultivo, riego y producción. Mostrar que **`updatedAt`** cambió.

### 🗑️ Eliminar — `PATCH /api/parcelas/{id}/eliminar`
Sin body. ➡️ `estado: false` y `deletedAt` con fecha y hora. Verla en `GET /api/parcelas/estado/false`.

### ♻️ Restaurar — `PATCH /api/parcelas/{id}/restaurar`
Sin body. ➡️ `estado: true` y `restoredAt` con fecha y hora.

### 📥 Importar — `POST /api/parcelas/importar/csv`
- En Swagger: **Try it out** → campo **`file`** → **Choose File** → `ASE251S4_T05-be/csv/parcelas.csv` → **Execute**.
- Excel: `POST /api/parcelas/importar/excel` con un `.xlsx` de las mismas columnas.

Columnas del CSV:
```
nombre,ubicacion,areaHectareas,tipoSuelo,responsable,estadoRiego,fechaUltimaSiembra,produccionEstimada,cultivoActual,observaciones
```
➡️ Respuesta probada:
```json
{ "totalFilas": 15, "importados": 15, "fallidos": 0, "errores": [] }
```

### 📤 Exportar
| Formato | Ruta | Resultado probado |
| :-- | :-- | :-- |
| Excel | `GET /api/parcelas/exportar/excel` | `.xlsx` con todos los registros (16 filas tras importar) |
| PDF | `GET /api/parcelas/exportar/pdf` | `.pdf` con la tabla de parcelas |

En Swagger aparece **Download file** para descargarlo.

---

## 2. 🧪 INSUMOS (Hugo Fernández) — `/api/insumos`

### Campos

| # | Campo | Tipo | Obligatorio | Regla |
| :-: | :-- | :-- | :-: | :-- |
| 1 | `nombre` | texto | ✅ | máx. 100 · **no se repite** entre activos |
| 2 | `descripcion` | texto | | máx. 1000 |
| 3 | `precio` | decimal | ✅ | > 0 y ≤ 50 000 |
| 4 | `stock` | entero | ✅ | ≥ 0 y ≤ 1 000 000 |
| 5 | `unidadMedida` | texto | ✅ | **solo:** `kg`, `g`, `L`, `ml`, `unidad`, `bolsa`, `saco`, `bidon`, `tonelada` |
| 6 | `tipoInsumo` | texto | ✅ | **solo:** `FERTILIZANTE`, `PESTICIDA`, `HERBICIDA`, `FUNGICIDA`, `SEMILLA`, `OTRO` |
| 7 | `proveedor` | texto | | máx. 100 |
| 8 | `presentacion` | texto | | máx. 100 |
| 9 | `estado` | sí/no | auto | |
| 10–13 | `createdAt` · `updatedAt` · `deletedAt` · `restoredAt` | fecha y hora | auto | auditoría |
| 14 | `id` | texto | auto | ej. `INS-FERT-852` |

### ➕ Registrar — `POST /api/insumos`
```json
{
  "nombre": "Fertilizante Foliar Demo",
  "descripcion": "Fertilizante foliar NPK 20-20-20 para etapa de floración",
  "precio": 45.90,
  "stock": 120,
  "unidadMedida": "L",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "Agroquímicos del Sur S.A.C.",
  "presentacion": "Bidón 20 L"
}
```

### ✏️ Editar — `PUT /api/insumos/{id}`
```json
{
  "nombre": "Fertilizante Foliar Demo",
  "descripcion": "Fertilizante foliar NPK 20-20-20 para etapa de floración",
  "precio": 47.50,
  "stock": 80,
  "unidadMedida": "L",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "Agroquímicos del Sur S.A.C.",
  "presentacion": "Bidón 20 L"
}
```
⚠️ Un insumo **eliminado no se puede editar**: primero hay que restaurarlo.

### 🗑️ Eliminar / ♻️ Restaurar
`PATCH /api/insumos/{id}/eliminar` · `PATCH /api/insumos/{id}/restaurar` (sin body).

### 📥 Importar — `POST /api/insumos/importar/csv` (campo `file`)
Archivo: `ASE251S4_T05-be/csv/insumos.csv`
```
nombre,descripcion,precio,stock,unidadMedida,tipoInsumo,proveedor,presentacion
```
➡️ Probado: `{ "totalFilas": 15, "importados": 15, "fallidos": 0, "errores": [] }`

### 📤 Exportar
`GET /api/insumos/exportar/excel` · `GET /api/insumos/exportar/pdf`

---

## 3. 👩‍🌾 USUARIOS (Axel Huapaya) — `/api/usuarios`

### Campos

| # | Campo | Tipo | Obligatorio | Regla |
| :-: | :-- | :-- | :-: | :-- |
| 1 | `nombre` | texto | ✅ | máx. 100 |
| 2 | `apellido` | texto | ✅ | máx. 100 |
| 3 | `correo` | email | ✅ | formato válido · **no se repite** |
| 4 | `password` | texto | | |
| 5 | `rol` | texto | | máx. 20 · `ADMIN`, `SUPERVISOR`, `AGRONOMO`, `OPERARIO` |
| 6 | `fechaNacimiento` | fecha `AAAA-MM-DD` | | |
| 7 | `fechaContratacion` | fecha `AAAA-MM-DD` | | |
| 8 | `estado` | sí/no | auto | |
| 9–12 | `createdAt` · `updatedAt` · `deletedAt` · `restoredAt` | fecha y hora | auto | auditoría |
| 13 | `id` | texto | auto | ej. `USR-SUP-306` |

### ➕ Registrar — `POST /api/usuarios`
```json
{
  "nombre": "Lucía",
  "apellido": "Ramos Torres",
  "correo": "lucia.ramos@agropacayales.com",
  "password": "Agro2026!",
  "rol": "SUPERVISOR",
  "fechaNacimiento": "1995-04-18",
  "fechaContratacion": "2024-03-01"
}
```
⚠️ Si ya registraste este correo, cámbialo (`lucia.ramos2@...`): el correo no se puede repetir.

### ✏️ Editar — `PUT /api/usuarios/{id}`
```json
{
  "nombre": "Lucía",
  "apellido": "Ramos Quispe",
  "correo": "lucia.ramos@agropacayales.com",
  "password": "Agro2026!",
  "rol": "AGRONOMO",
  "fechaNacimiento": "1995-04-18",
  "fechaContratacion": "2024-03-01"
}
```

### 🗑️ Eliminar / ♻️ Restaurar
`PATCH /api/usuarios/{id}/eliminar` · `PATCH /api/usuarios/{id}/restaurar` (sin body).

### 📥 Importar — `POST /api/usuarios/importar/csv` (campo `file`)
Archivo: `ASE251S4_T05-be/csv/usuarios.csv`
```
nombre,apellido,correo,password,rol,fechaNacimiento,fechaContratacion
```
➡️ Probado: `{ "totalFilas": 12, "importados": 12, "fallidos": 0, "errores": [] }`

### 📤 Exportar
`GET /api/usuarios/exportar/excel` · `GET /api/usuarios/exportar/pdf`

---

## 4. ❌ Errores para mostrar las validaciones (opcional, suma en la demo)

| Prueba | JSON | Respuesta real (400) |
| :-- | :-- | :-- |
| Parcela sin nombre | `{ "nombre": "", "areaHectareas": 5 }` | `"nombre": "El nombre de la parcela es obligatorio."` |
| Insumo con unidad inválida | `{ "nombre": "Prueba", "precio": 10, "stock": 5, "unidadMedida": "caja", "tipoInsumo": "FERTILIZANTE" }` | `La unidad de medida 'caja' no es válida. Unidades aceptadas: kg, g, L, ml, unidad, bolsa, saco, bidon, tonelada` |
| Usuario con correo inválido | `{ "nombre": "X", "apellido": "Y", "correo": "no-es-correo" }` | `"correo": "El correo electrónico debe tener un formato válido."` |
| Buscar un id que no existe | `GET /api/parcelas/NOEXISTE` | **404** no encontrado |

**Qué decir:** "Las validaciones están en dos niveles. **Bean Validation** en el modelo (`@NotBlank`, `@Email`, `@Positive`) y **reglas de negocio** en el servicio (unidades permitidas, nombre o correo sin repetir). `GlobalExceptionHandler` devuelve los errores con un formato uniforme."

---

## 5. Resumen de rutas de los 3 maestros

| Acción | Parcelas | Insumos | Usuarios |
| :-- | :-- | :-- | :-- |
| Listar | `GET /api/parcelas` | `GET /api/insumos` | `GET /api/usuarios` |
| Activos / eliminados | `GET …/estado/true` · `…/estado/false` | igual | igual |
| Buscar por id | `GET …/{id}` | igual | igual |
| Registrar | `POST /api/parcelas` | `POST /api/insumos` | `POST /api/usuarios` |
| Editar | `PUT …/{id}` | igual | igual |
| Eliminar | `PATCH …/{id}/eliminar` | igual | igual |
| Restaurar | `PATCH …/{id}/restaurar` | igual | igual |
| Importar | `POST …/importar/csv` · `…/importar/excel` (`file`) | igual | igual |
| Exportar | `GET …/exportar/excel` · `…/exportar/pdf` | igual | igual |

---

## 6. Extra — Mi transacción Cosechas (SQL Server) — `/api/harvest`

### ➕ Registrar — `POST /api/harvest`
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
| Acción | Ruta |
| :-- | :-- |
| Listar | `GET /api/harvest` |
| Editar | `PUT /api/harvest/{id}` (mismo JSON) |
| Eliminar / Restaurar | `PUT /api/harvest/eliminar/{id}` · `PUT /api/harvest/restaurar/{id}` |

`idCultivo` debe existir en la tabla `cultivos` de SQL Server (la carga inicial ya trae cultivos con id 1, 2, 3…).
