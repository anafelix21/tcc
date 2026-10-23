package Agropacayales.valleGrande.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
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
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .info(new Info()
                        .title("AgroPacayales API - Reactivo (Spring WebFlux + MongoDB)")
                        .version("1.0.0")
                        .description("Backend 1 (Spring Boot WebFlux): maestros en MongoDB (Usuario, Insumo, Parcela), transacciones en SQL Server "
                                + "(Cosechas, Actividades, Asignaciones) y autenticación JWT. Obtenga el token en POST /api/auth/login y use el botón Authorize.")
                        .contact(new Contact()
                                .name("Valle Grande - AgroPacayales Team")
                                .email("soporte@agropacayales.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://springdoc.org")));
    }
}
