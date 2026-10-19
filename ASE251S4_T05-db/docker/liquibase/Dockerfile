FROM maven:3.9.9-eclipse-temurin-21 AS dependencies
WORKDIR /dependencies
COPY docker/liquibase/pom.xml .
RUN mvn -B org.apache.maven.plugins:maven-dependency-plugin:3.8.1:copy-dependencies \
    -DincludeArtifactIds=liquibase-mongodb,mongodb-driver-sync,mongodb-driver-core,bson,jackson-core,jackson-databind,jackson-annotations \
    -DoutputDirectory=/dependencies/jars

FROM liquibase/liquibase:4.33.0
COPY --from=dependencies /dependencies/jars/ /liquibase/lib/
WORKDIR /workspace

LABEL org.opencontainers.image.title="Agro Pacayales S.A.C. Polyglot Liquibase Runner" \
      org.opencontainers.image.description="Runner reutilizable de Liquibase Community para persistencia políglota"
