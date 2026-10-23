package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.model.FichaCampo;
import Agropacayales.valleGrande.service.FichaCampoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/fichas-campo")
@RequiredArgsConstructor
@Tag(name = "FichaCampo-Controller", description = "Operaciones reactivas para diario técnico y fichas de campo (WebFlux + MongoDB)")
public class FichaCampoController {

    private final FichaCampoService fichaService;

    @GetMapping
    @Operation(summary = "Listar todas las fichas de campo")
    public Flux<FichaCampo> listarTodos() {
        return fichaService.listarTodos();
    }

    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar fichas de campo por estado")
    public Flux<FichaCampo> listarPorEstado(@PathVariable Boolean estado) {
        return fichaService.listarPorEstado(estado);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener ficha de campo por ID")
    @ApiResponse(responseCode = "200", description = "Ficha encontrada")
    @ApiResponse(responseCode = "404", description = "Ficha no encontrada")
    public Mono<ResponseEntity<FichaCampo>> buscarPorId(@PathVariable String id) {
        return fichaService.buscarPorId(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Registrar nueva ficha de campo")
    @ApiResponse(responseCode = "201", description = "Ficha creada exitosamente")
    public Mono<ResponseEntity<FichaCampo>> crear(@RequestBody FichaCampo ficha) {
        return fichaService.crear(ficha)
                .map(nuevo -> ResponseEntity.status(HttpStatus.CREATED).body(nuevo));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar ficha de campo")
    @ApiResponse(responseCode = "200", description = "Ficha actualizada exitosamente")
    public Mono<ResponseEntity<FichaCampo>> editar(@PathVariable String id, @RequestBody FichaCampo ficha) {
        return fichaService.editar(id, ficha)
                .map(ResponseEntity::ok);
    }

    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar ficha de campo lógicamente")
    public Mono<ResponseEntity<FichaCampo>> eliminar(@PathVariable String id) {
        return fichaService.eliminar(id)
                .map(ResponseEntity::ok);
    }

    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar ficha de campo lógicamente")
    public Mono<ResponseEntity<FichaCampo>> restaurar(@PathVariable String id) {
        return fichaService.restaurar(id)
                .map(ResponseEntity::ok);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Desactivar ficha de campo (DELETE alias)")
    public Mono<ResponseEntity<FichaCampo>> eliminarAlias(@PathVariable String id) {
        return fichaService.eliminar(id)
                .map(ResponseEntity::ok);
    }
}
