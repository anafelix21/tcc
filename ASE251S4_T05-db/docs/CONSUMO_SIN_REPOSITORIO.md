# Consumo sin clonar el repositorio — Agro Pacayales S.A.C.

Esta guía es para quienes solo necesitan los archivos de configuración de Compose para levantar las bases de datos de Agro Pacayales S.A.C., utilizando únicamente las imágenes Docker publicadas.

## 1. Descargar solo los archivos necesarios

Crea una carpeta en tu equipo y descarga únicamente `compose.yaml` y `.env.example`:

```bash
mkdir agropacayales-db
cd agropacayales-db
```

En Linux/macOS:
```bash
curl -O https://raw.githubusercontent.com/vallegrande/ASE251S4_T05-db/develop/compose.yaml
curl -O https://raw.githubusercontent.com/vallegrande/ASE251S4_T05-db/develop/.env.example
```

En PowerShell:
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vallegrande/ASE251S4_T05-db/develop/compose.yaml" -OutFile "compose.yaml"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vallegrande/ASE251S4_T05-db/develop/.env.example" -OutFile ".env.example"
```

## 2. Configurar contraseñas

```powershell
Copy-Item .env.example .env
```

## 3. Levantar con imágenes publicadas

```bash
docker compose pull
docker compose up -d
```

## 4. Credenciales de Conexión

### SQL Server 2022
- **Host:** `localhost`
- **Puerto:** `1433`
- **Usuario:** `sa`
- **Contraseña:** `AgroPacayales2026!`
- **Base de datos:** `agropacayales_db`

### MongoDB 8.0
- **Host:** `localhost`
- **Puerto:** `27017`
- **Usuario:** `admin`
- **Contraseña:** `AgroAdmin2026!`
- **Base de datos:** `agropacayales_db`
- **Mecanismo Auth:** `SCRAM-SHA-256` (admin)
