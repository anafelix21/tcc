package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.request.ActividadCultivoRequestDto;
import Agropacayales.valleGrande.dto.response.ActividadCultivoResponseDto;
import Agropacayales.valleGrande.service.ActividadCultivoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/actividades-cultivos")
@RequiredArgsConstructor
@Tag(name = "Actividad-Cultivo-Controller", description = "Módulo Transaccional de Hugo Fernández: Actividades agrícolas y consumo de insumos (WebFlux + SQL Server R2DBC + MongoDB)")
public class ActividadCultivoController {

    private final ActividadCultivoService service;

    // GET - Listar todas las actividades con cabecera y detalle (FLUX)
    @GetMapping
    @Operation(summary = "Listar todas las actividades de cultivo", description = "Retorna el flujo reactivo de todas las actividades registradas con su cabecera y lista de insumos consumidos.")
    public Flux<ActividadCultivoResponseDto> listarTodas() {
        return service.listarTodas();
    }

    // GET - Listar actividades por estado (FLUX)
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar actividades por estado", description = "Filtra actividades activas o inactivas.")
    public Flux<ActividadCultivoResponseDto> listarPorEstado(@PathVariable Boolean estado) {
        return service.listarPorEstado(estado);
    }

    // GET - Listar por ID (MONO)
    @GetMapping("/{id}")
    @Operation(summary = "Obtener actividad por ID", description = "Obtiene los detalles completos de la cabecera y detalle de la actividad solicitada.")
    @ApiResponse(responseCode = "200", description = "Actividad encontrada")
    @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
    public Mono<ResponseEntity<ActividadCultivoResponseDto>> listarPorId(@PathVariable Long id) {
        return service.listarPorId(id)
                .map(ResponseEntity::ok);
    }

    // POST - Crear actividad transaccional con cabecera y detalles (MONO)
    @PostMapping
    @Operation(summary = "Registrar actividad de cultivo", description = "Registra atómicamente la cabecera de la actividad y sus detalles de insumos en SQL Server.")
    @ApiResponse(responseCode = "201", description = "Actividad registrada con éxito")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o insumos no disponibles")
    public Mono<ResponseEntity<ActividadCultivoResponseDto>> crear(@Valid @RequestBody ActividadCultivoRequestDto request) {
        return service.crear(request)
                .map(res -> ResponseEntity.status(HttpStatus.CREATED).body(res));
    }

    // PUT - Editar actividad existente con cabecera y detalles (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Editar actividad de cultivo", description = "Actualiza de manera reactiva la cabecera y reemplaza los detalles de insumos en SQL Server.")
    @ApiResponse(responseCode = "200", description = "Actividad actualizada correctamente")
    @ApiResponse(responseCode = "404", description = "Actividad no encontrada")
    public Mono<ResponseEntity<ActividadCultivoResponseDto>> editar(
            @PathVariable Long id,
            @Valid @RequestBody ActividadCultivoRequestDto request) {
        return service.editar(id, request)
                .map(ResponseEntity::ok);
    }

    // PATCH - Eliminación lógica
    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar actividad (Lógico)", description = "Desactiva la actividad cambiando su estado a false.")
    public Mono<ResponseEntity<ActividadCultivoResponseDto>> eliminar(@PathVariable Long id) {
        return service.eliminar(id)
                .map(ResponseEntity::ok);
    }

    // PATCH - Restauración lógica
    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar actividad", description = "Reactiva una actividad previamente desactivada.")
    public Mono<ResponseEntity<ActividadCultivoResponseDto>> restaurar(@PathVariable Long id) {
        return service.restaurar(id)
                .map(ResponseEntity::ok);
    }
}
