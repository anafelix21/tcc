# AgroPacayales - Migración WebFlux y MongoDB Reactivo

Este proyecto contiene la migración del backend del proyecto AgroPacayales (ASE251S4_T05-be) implementando una arquitectura 100% reactiva no bloqueante usando **Spring WebFlux** y **Spring Data MongoDB Reactive**.

## 🚀 1. Cambios Realizados y Dependencias Agregadas

Se reemplazó la arquitectura tradicional (Spring Web MVC + JPA + SQL) por programación reactiva. Para ello, en el `pom.xml` se modificaron/agregaron las siguientes dependencias clave:

- **`spring-boot-starter-webflux`**: Reemplaza a `spring-web`. Provee el servidor Netty y las clases reactivas (`Mono` y `Flux`).
- **`spring-boot-starter-data-mongodb-reactive`**: Reemplaza a Spring Data JPA. Provee la conexión asíncrona a la base de datos NoSQL.
- **`springdoc-openapi-starter-webflux-ui`**: (Versión 2.8.5) Reemplaza al Swagger tradicional para soportar endpoints reactivos.

Toda la lógica (Controladores, Servicios y Repositorios) ahora retorna:
- `Mono<T>`: Para peticiones que devuelven un solo objeto o vacío (ej. Buscar por ID, Crear, Actualizar, Eliminar).
- `Flux<T>`: Para peticiones que devuelven múltiples elementos (ej. Listar todos, Listar por estado).

---

## ⚙️ 2. Configuración y Arranque del Proyecto (Perfiles)

El archivo `src/main/resources/application.yml` está configurado con **Spring Profiles** para separar el entorno de desarrollo local del entorno en la nube, evitando mezclar los datos.

### Para ejecutar en modo LOCAL (Tu PC / Docker):
Este es el modo por defecto. Busca conectarse a un MongoDB en `localhost:27017`.
```bash
mvn spring-boot:run
```
*(Revisa los comentarios en el `application.yml` si necesitas quitarle la contraseña a la conexión local).*

### Para ejecutar en modo NUBE (MongoDB Atlas):
Utiliza la base de datos compartida en Atlas (`agropacayales_db`).
> **Nota para PowerShell:** Usa comillas en el parámetro `-D`.
```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=cloud"
```
*(Comandos CMD o Git Bash no necesitan comillas).*

---

## 🌐 3. Acceso a la Documentación (Swagger)

Una vez iniciada la aplicación en cualquiera de los dos perfiles, la documentación interactiva estará disponible en el puerto `8081`:

👉 **[http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)**

---

## 📝 4. JSON de Pruebas para Swagger UI

A continuación, se proporcionan los cuerpos de petición listos para copiar y pegar directamente en **Swagger UI** ([http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)). Para la guía detallada con todos los módulos y respuestas esperadas, consulte [docs/GUIA_SWAGGER.md](file:///c:/Users/anacr/OneDrive/Imágenes/Desktop/sprint8/tcc/docs/GUIA_SWAGGER.md).

### 🔑 Autenticación (POST `/api/auth/login`)
```json
{
  "correo": "hugo@agro.com",
  "password": "Password123!"
}
```
*(Copie el `token` devuelto y péguelo en el botón verde **Authorize** arriba a la derecha en Swagger).*

### 👤 A. Crear Usuario (POST `/api/usuarios`)
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "correo": "juan.perez@agropacayales.com",
  "password": "Password123!",
  "rol": "ADMIN",
  "fechaNacimiento": "1990-05-15",
  "fechaContratacion": "2023-01-10",
  "estado": true
}
```

### 🧪 B. Crear Insumo (POST `/api/insumos`)
```json
{
  "nombre": "Biofertilizante Foliar Sprint8",
  "descripcion": "Fertilizante balanceado para crecimiento acelerado",
  "precio": 65.50,
  "stock": 40,
  "unidadMedida": "L",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "AgroK",
  "presentacion": "Galón 4L",
  "estado": true
}
```

### 🌱 C. Crear Parcela (POST `/api/parcelas`)
```json
{
  "codigo": "PARC-DEMO01",
  "nombre": "Sector Norte A1",
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

---

## 📁 Estructura del Repositorio

| Carpeta / Archivo | Contenido |
| :-- | :-- |
| `src/main/java/Agropacayales/valleGrande/` | Código del Backend 1 (Spring Boot WebFlux): `rest/` controladores, `service/` lógica de negocio, `model/` entidades (MongoDB y R2DBC), `repository/`, `security/` (JWT), `events/` (eventos al Backend 2 analítico), `config/` (CORS y OpenAPI) |
| `src/main/resources/` | `application.yml` (perfiles local y nube) y scripts SQL |
| `csv/` | Archivos de ejemplo para importación masiva (CSV / Excel) |
| `Dockerfile` | Imagen oficial del Backend 1 (Maven + JRE 21, puerto `8081`) |
| `Dockerfile.fast` | Variante de construcción rápida |
| `dockerfile-ana/`, `dockerfile-axel/`, `dockerfile-hugo/` | Dockerfiles usados por el CI de cada integrante |
| `manifest-ana/`, `manifest-axel/`, `manifest-hugo/` | Manifiestos de Kubernetes de cada integrante |
| `.github/workflows/` | Pipelines de GitHub Actions que publican la imagen en Docker Hub |
