FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY check/pom.xml .
RUN mvn -B dependency:go-offline
COPY check/src src
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/target/ase251s4-t05-db-checker-0.1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
