package pe.edu.vallegrande.checker.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.MongoCredential;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import io.r2dbc.spi.ConnectionFactories;
import io.r2dbc.spi.ConnectionFactory;
import io.r2dbc.spi.ConnectionFactoryOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import static io.r2dbc.spi.ConnectionFactoryOptions.PASSWORD;
import static io.r2dbc.spi.ConnectionFactoryOptions.USER;

@Configuration
public class DatabaseConfig {
    @Bean
    ConnectionFactory connectionFactory(CheckerProperties properties) {
        var sql = properties.sqlserver();
        var options = ConnectionFactoryOptions.parse(sql.url()).mutate()
                .option(USER, sql.username()).option(PASSWORD, sql.password()).build();
        return ConnectionFactories.get(options);
    }

    @Bean(destroyMethod = "close")
    MongoClient mongoClient(CheckerProperties properties) {
        var mongo = properties.mongodb();
        var settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(mongo.url()))
                .credential(MongoCredential.createCredential(
                        mongo.username(), mongo.authenticationDatabase(), mongo.password().toCharArray()))
                .build();
        return MongoClients.create(settings);
    }
}
