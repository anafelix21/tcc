package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.model.r2dbc.Cultivo;
import Agropacayales.valleGrande.repository.r2dbc.CultivoR2dbcRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/cultivos")
@RequiredArgsConstructor
@Tag(name = "Cultivo-Controller", description = "Catálogo de cultivos (SQL Server) para seleccionar en cosechas y actividades")
public class CultivoController {

    private final CultivoR2dbcRepository cultivoRepository;

    @GetMapping
    @Operation(summary = "Listar cultivos activos")
    public Flux<Cultivo> listarActivos() {
        return cultivoRepository.findByEstado(true);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cultivo por ID")
    public Mono<ResponseEntity<Cultivo>> obtener(@PathVariable Long id) {
        return cultivoRepository.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/parcela/{idParcela}")
    @Operation(summary = "Listar cultivos de una parcela (id de MongoDB)")
    public Flux<Cultivo> listarPorParcela(@PathVariable String idParcela) {
        return cultivoRepository.findByIdParcela(idParcela);
    }
}
