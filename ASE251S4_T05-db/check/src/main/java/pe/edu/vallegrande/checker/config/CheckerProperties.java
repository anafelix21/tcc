package pe.edu.vallegrande.checker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("checker")
public record CheckerProperties(SqlServer sqlserver, Mongo mongodb) {
    public record SqlServer(String url, String username, String password) {}
    public record Mongo(String url, String username, String password, String database, String authenticationDatabase) {}
}
