package Agropacayales.valleGrande.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AgroPacayales API - Reactivo (Spring WebFlux + MongoDB)")
                        .version("1.0.0")
                        .description("API REST Reactiva para la gestión de maestros agrícolas: Usuario, Insumo y Parcela.")
                        .contact(new Contact()
                                .name("Valle Grande - AgroPacayales Team")
                                .email("soporte@agropacayales.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://springdoc.org")));
    }
}
