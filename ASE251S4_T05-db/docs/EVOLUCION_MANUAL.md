# Evolución manual del esquema y datos — Agro Pacayales S.A.C.

Esta guía explica cómo agregar nuevas tablas, columnas, colecciones o datos a las bases de datos de forma ordenada y reproducible, usando las carpetas `bootstrap/` y `changes/`.

## Estructura de carpetas

```text
db/
├── sqlserver/
│   ├── bootstrap/      ← Scripts de estado inicial V001 (se ejecutan una sola vez al crear la BD)
│   ├── changes/        ← Scripts de cambios incrementales V002... (migraciones)
│   ├── checks/         ← Verificación de contrato por versión
│   ├── metadata/       ← Registro de cambios en dbo.schema_changes
│   ├── Dockerfile
│   └── run.sh
└── mongodb/
    ├── bootstrap/      ← Scripts de estado inicial V001 (JS para mongosh)
    ├── changes/        ← Scripts de cambios incrementales V002... (JS o JSON para mongosh)
    ├── checks/         ← Verificación de contrato por versión
    ├── metadata/       ← Registro de cambios en schema_changes
    ├── Dockerfile
    └── run.sh
```

## Convención de nombres

Los scripts deben nombrarse con un número de secuencia secuencial (`V001`, `V002`, `V003`...):

```text
V001_baseline.sql
V002_auditoria_labores.sql
```

```text
V001__baseline.js
V002_modelado_estrategias.js
```

## Cuándo usar `bootstrap/` y cuándo `changes/`

| Carpeta | Cuándo usarla |
|---|---|
| `bootstrap/` | Estado inicial completo (V001): creación de BD, tablas, colecciones, índices y datos semilla base. Solo se ejecuta desde cero. |
| `changes/` | Cambios incrementales (V002 en adelante): nuevas tablas, columnas, colecciones, validadores modificados o datos adicionales. |

> Si bajas los volúmenes con `docker compose down --volumes`, `bootstrap/` se vuelve a ejecutar completo y luego se aplican los `changes/` en estricto orden secuencial.

## 1. Agregar un cambio en SQL Server

Crea un archivo nuevo en `db/sqlserver/changes/` (por ejemplo `V003_nueva_tabla.sql`):

```sql
USE agropacayales_db;
GO

IF OBJECT_ID('dbo.nueva_tabla', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.nueva_tabla (
        id INT PRIMARY KEY IDENTITY(1,1),
        descripcion NVARCHAR(100) NOT NULL
    );
END;
GO
```

## 2. Agregar un cambio en MongoDB

Crea un archivo nuevo en `db/mongodb/changes/` (por ejemplo `V003_nueva_coleccion.js`):

```javascript
var adminDb = db.getSiblingDB('admin');
if (!adminDb.auth(process.env.MONGO_ADMIN_USER, process.env.MONGO_ADMIN_PASSWORD)) {
  throw Error('Autenticación MongoDB fallida');
}

db = db.getSiblingDB(process.env.MONGO_DATABASE || 'agropacayales_db');

if (db.getCollectionInfos({ name: 'nueva_coleccion' }).length === 0) {
    db.createCollection('nueva_coleccion');
    db.nueva_coleccion.createIndex({ codigo: 1 });
}
```

## 3. Aplicar los cambios

Como se modificaron archivos locales, reconstruye las imágenes de inicialización:

```bash
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

## 4. Verificar que se aplicaron

```bash
docker compose logs --no-color sql-init
docker compose logs --no-color mongo-init
```
