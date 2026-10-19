package pe.edu.vallegrande.checker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("checker")
public record CheckerProperties(Postgres postgres, Mongo mongodb) {
    public record Postgres(String url, String username, String password) {}
    public record Mongo(String url, String username, String password, String database, String authenticationDatabase) {}
}
