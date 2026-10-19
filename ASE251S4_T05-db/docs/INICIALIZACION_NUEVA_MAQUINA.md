# Inicialización en una máquina nueva — Agro Pacayales S.A.C.

Esta guía es para integrantes del equipo y evaluadores que van a levantar el entorno de persistencia políglota desde cero en una máquina nueva.

## 1. Requisitos previos

- Docker Desktop (Windows/macOS) o Docker Engine con Compose v2 (Linux).
- Git para clonar el repositorio.

No se requiere tener instalados localmente SQL Server, MongoDB ni Java/Maven; Docker proporciona todo el entorno contenerizado.

## 2. Clonar el repositorio

```bash
git clone https://github.com/vallegrande/ASE251S4_T05-db.git
cd ASE251S4_T05-db
```

## 3. Configurar contraseñas y variables

Copia el archivo de variables de entorno:

```bash
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

## 4. Construir y levantar desde el código fuente

```bash
docker compose -f compose.yaml -f compose.build.yaml up -d --build
```

Compose realiza el proceso en estricto orden de dependencias:
1. Inicia `sqlserver` y `mongodb`.
2. Espera a que los healthchecks de ambos motores respondan con éxito (`healthy`).
3. Ejecuta `sql-init` y `mongo-init` aplicando `V001` y `V002`.
4. Levanta el microservicio `checker` una vez que ambos inicializadores terminan exitosamente con código 0.

## 5. Verificar el estado

```bash
docker compose ps -a
```

Estado esperado:
| Contenedor | Estado esperado |
|---|---|
| `sqlserver` | `Up (healthy)` |
| `mongodb` | `Up (healthy)` |
| `sql-init` | `Exited (0)` |
| `mongo-init` | `Exited (0)` |
| `checker` | `Up` |

## 6. Probar el microservicio Checker

Abre en tu navegador:
- Swagger UI: `http://localhost:8080/swagger-ui`
- Diagnóstico: `http://localhost:8080/diagnostics`
- Versión activa: `http://localhost:8080/version`
