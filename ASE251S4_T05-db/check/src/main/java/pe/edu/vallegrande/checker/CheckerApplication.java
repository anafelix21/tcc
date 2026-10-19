package pe.edu.vallegrande.checker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class CheckerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CheckerApplication.class, args);
    }
}
