# Checker de Persistencia Políglota — Agro Pacayales S.A.C. (Team 05)

Microservicio de diagnóstico y verificación automatizada para Microsoft SQL Server 2022 y MongoDB 8.0.

## Endpoints Disponibles

- `GET /health`: Estado general del proceso y metadatos de build.
- `GET /connections`: Verificación de conectividad en vivo y latencias (ms) hacia ambos motores.
- `GET /version`: Inspección de contratos versionados, secuencias aplicadas y sincronización entre motores.
- `GET /contract`: Verificación estructural de tablas, colecciones, índices y esquemas activos.
- `GET /samples`: Lectura de registros y documentos semilla de prueba en ambos motores.
- `GET /diagnostics`: Diagnóstico consolidado de salud, alineación y consistencia.
- `GET /swagger-ui`: Interfaz interactiva de documentación OpenAPI 3.0.
