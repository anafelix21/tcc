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

## 📝 4. JSON de Pruebas para Creación (CRUD)

A continuación, se proporcionan los cuerpos de petición que pueden copiar y pegar en Swagger (o Postman) para probar el método `POST` de cada maestro.

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
  "nombre": "Fertilizante NPK 20-20-20",
  "descripcion": "Fertilizante balanceado para crecimiento acelerado",
  "precio": 45.50,
  "stock": 100,
  "unidadMedida": "KG",
  "tipoInsumo": "FERTILIZANTE",
  "proveedor": "AgroK",
  "presentacion": "Saco de 50KG",
  "estado": true
}
```

### 🌱 C. Crear Parcela (POST `/api/parcelas`)
```json
{
  "nombre": "Sector Norte A1",
  "ubicacion": "Coordenadas -12.043, -77.028",
  "areaHectareas": 5.5,
  "tipoSuelo": "ARCILLOSO",
  "responsable": "Carlos Mendoza",
  "estadoRiego": "ACTIVO",
  "fechaUltimaSiembra": "2023-10-01",
  "produccionEstimada": 15000.0,
  "cultivoActual": "Palta Hass",
  "observaciones": "Terreno preparado para la próxima temporada de lluvias",
  "enUso": true,
  "estado": true
}
```
