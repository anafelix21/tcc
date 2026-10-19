# Stage 1: Build with Maven
# FROM maven:3.9-amazoncorretto-25-alpine AS builder   # Imágen no oficial (ligero)
# FROM maven:eclipse-temurin AS builder                # Imágen oficial (pesado)
FROM hugo454/maven:3.9-amazoncorretto-25-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run with Java
# FROM eclipse-temurin:25-jre-alpine  # Imágen no oficial (ligero)
# FROM openjdk:12-ea-25-jdk-oracle    # Imágen oficial (pesado)
FROM hugo454/eclipse-temurin:25-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]


# ==============================================================================
# COMANDOS DE CONSTRUCCIÓN Y PUBLICACIÓN EN DOCKER HUB (HUGO FERNÁNDEZ #07)
# ==============================================================================

# 1. Construir la imagen desde la raíz del proyecto:
# docker build -t hugo454/s5-springwebflux-mongodb:1.0 -f dockerfile-hugo/Dockerfile .

# 2. Probar el contenedor localmente:
# docker run -d --name springwebflux-mongodb -p 8081:8081 hugo454/s5-springwebflux-mongodb:1.0

# 3. Subir la imagen a Docker Hub:
# docker push hugo454/s5-springwebflux-mongodb:1.0

# ------------------------------------------------------------------------------
# Referencias de imágenes base personalizadas en Docker Hub:
# docker pull maven:3.9-amazoncorretto-25-alpine
# docker tag maven:3.9-amazoncorretto-25-alpine hugo454/maven:3.9-amazoncorretto-25-alpine
# docker push hugo454/maven:3.9-amazoncorretto-25-alpine

# docker pull eclipse-temurin:25-jre-alpine
# docker tag eclipse-temurin:25-jre-alpine hugo454/eclipse-temurin:25-jre-alpine
# docker push hugo454/eclipse-temurin:25-jre-alpine