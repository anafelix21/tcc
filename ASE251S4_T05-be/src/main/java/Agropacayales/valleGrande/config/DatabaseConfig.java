package Agropacayales.valleGrande.config;

import io.r2dbc.spi.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;
import org.springframework.data.r2dbc.repository.config.EnableR2dbcRepositories;
import org.springframework.r2dbc.connection.R2dbcTransactionManager;
import org.springframework.transaction.ReactiveTransactionManager;
import org.springframework.transaction.reactive.TransactionalOperator;

/**
 * Configuración de Persistencia Políglota Dual:
 * - MongoDB Reactivo para entidades Maestras (Insumo, Parcela, Usuario).
 * - SQL Server R2DBC Reactivo para entidades Transaccionales (Actividades, Cosechas, Asignaciones).
 */
@Configuration
@EnableReactiveMongoRepositories(basePackages = "Agropacayales.valleGrande.repository.mongo")
@EnableR2dbcRepositories(basePackages = "Agropacayales.valleGrande.repository.r2dbc")
public class DatabaseConfig {

    @Bean
    public ReactiveTransactionManager transactionManager(ConnectionFactory connectionFactory) {
        return new R2dbcTransactionManager(connectionFactory);
    }

    @Bean
    public TransactionalOperator transactionalOperator(ReactiveTransactionManager transactionManager) {
        return TransactionalOperator.create(transactionManager);
    }
}
