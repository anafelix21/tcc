# Uso local sin realizar cambios de esquema — Agro Pacayales S.A.C.

Esta guía es para desarrolladores de aplicaciones frontend o backend (Spring Boot, Angular, Node.js) que solo necesitan consumir los motores de base de datos en su estado más reciente.

## 1. Levantar el stack localmente

Si ya tienes el repositorio clonado:

```bash
docker compose up -d
```

Compose reutilizará los volúmenes existentes `sql-data` y `mongo-data`.

## 2. Monitorear el estado

```bash
docker compose ps
```

## 3. Conexión desde herramientas de administración

- **Azure Data Studio / SSMS:** Conectar a `localhost:1433`, usuario `sa`, contraseña `AgroPacayales2026!`.
- **MongoDB Compass:** Conectar a `mongodb://admin:AgroAdmin2026!@localhost:27017/agropacayales_db?authSource=admin`.

## 4. Detener el entorno sin perder datos

```bash
docker compose stop
```

Para reiniciar:

```bash
docker compose start
```
