# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run with Java
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]


# ==============================================================================
# COMANDOS DE CONSTRUCCIÓN Y PUBLICACIÓN EN DOCKER HUB (ANA FELIX #05)
# ==============================================================================

# 1. Construir la imagen desde la raíz del proyecto:
# docker build -t anafelix21/s11-spring-webflux:latest -f dockerfile-ana/Dockerfile .

# 2. Probar el contenedor localmente:
# docker run -d --name springwebflux-mongodb -p 8081:8081 anafelix21/s11-spring-webflux:latest

# 3. Subir la imagen a Docker Hub:
# docker push anafelix21/s11-spring-webflux:latest
