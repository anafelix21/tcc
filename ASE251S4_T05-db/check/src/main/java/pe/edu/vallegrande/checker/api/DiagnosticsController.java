package pe.edu.vallegrande.checker.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.edu.vallegrande.checker.service.DiagnosticsService;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api")
@Tag(name = "Agro Pacayales S.A.C. - Liquibase Cloud Diagnostics")
public class DiagnosticsController {
    private final DiagnosticsService service;
    public DiagnosticsController(DiagnosticsService service) { this.service = service; }

    @GetMapping("/diagnostics")
    @Operation(summary = "Resume alineación, conectividad e historial de ambos motores")
    Mono<Map<String, Object>> diagnostics() { return service.diagnostics(); }

    @GetMapping("/changes")
    @Operation(summary = "Compara changesets esperados con DATABASECHANGELOG")
    Mono<Map<String, Object>> changes() { return service.changes(); }

    @GetMapping("/contract")
    @Operation(summary = "Comprueba objetos estructurales mínimos del caso")
    Mono<Map<String, Object>> contract() { return service.contract(); }
}
