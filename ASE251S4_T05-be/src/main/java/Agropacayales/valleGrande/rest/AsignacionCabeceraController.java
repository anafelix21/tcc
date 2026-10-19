package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.request.AsignacionCabeceraRequestDto;
import Agropacayales.valleGrande.dto.response.AsignacionCabeceraResponseDto;
import Agropacayales.valleGrande.service.AsignacionCabeceraService;
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
@RequestMapping("/api/asignaciones-trabajadores")
@RequiredArgsConstructor
@Tag(name = "AsignacionTrabajadores-Controller", description = "Módulo Transaccional de Axel Huapaya: Asignación de operarios y costo de mano de obra (WebFlux + SQL Server R2DBC + MongoDB)")
public class AsignacionCabeceraController {

    private final AsignacionCabeceraService service;

    // GET - Listar todas las asignaciones (FLUX)
    @GetMapping
    @Operation(summary = "Listar todas las asignaciones", description = "Retorna el flujo de asignaciones con datos de cabecera y detalles de trabajadores asignados.")
    public Flux<AsignacionCabeceraResponseDto> listar() {
        return service.listarTodas();
    }

    // GET - Listar por estado (FLUX)
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar asignaciones por estado", description = "Filtra asignaciones activas o inactivas.")
    public Flux<AsignacionCabeceraResponseDto> listarPorEstado(@PathVariable Boolean estado) {
        return service.listarPorEstado(estado);
    }

    // GET - Listar por ID de actividad (FLUX)
    @GetMapping("/actividad/{idActividad}")
    @Operation(summary = "Listar asignaciones por ID de actividad", description = "Filtra asignaciones correspondientes a una labor agrícola específica.")
    public Flux<AsignacionCabeceraResponseDto> listarPorActividad(@PathVariable Long idActividad) {
        return service.listarPorActividad(idActividad);
    }

    // GET - Buscar por ID (MONO)
    @GetMapping("/{id}")
    @Operation(summary = "Buscar asignación por ID", description = "Obtiene la cabecera y detalle de una asignación específica.")
    @ApiResponse(responseCode = "200", description = "Asignación encontrada")
    @ApiResponse(responseCode = "404", description = "Asignación no encontrada")
    public Mono<ResponseEntity<AsignacionCabeceraResponseDto>> buscar(@PathVariable Long id) {
        return service.listarPorId(id)
                .map(ResponseEntity::ok);
    }

    // POST - Registrar nueva asignación transaccional (MONO)
    @PostMapping
    @Operation(summary = "Registrar asignación de trabajadores", description = "Registra atómicamente la asignación y sus detalles calculando costos de mano de obra en SQL Server.")
    @ApiResponse(responseCode = "201", description = "Asignación registrada exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o usuarios inactivos")
    public Mono<ResponseEntity<AsignacionCabeceraResponseDto>> registrar(@Valid @RequestBody AsignacionCabeceraRequestDto request) {
        return service.crear(request)
                .map(nuevo -> ResponseEntity.status(HttpStatus.CREATED).body(nuevo));
    }

    // PUT - Editar asignación existente (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Editar asignación de trabajadores", description = "Modifica la cabecera y reemplaza los detalles de operarios asignados en SQL Server.")
    @ApiResponse(responseCode = "200", description = "Asignación actualizada exitosamente")
    @ApiResponse(responseCode = "404", description = "Asignación no encontrada")
    public Mono<ResponseEntity<AsignacionCabeceraResponseDto>> editar(
            @PathVariable Long id,
            @Valid @RequestBody AsignacionCabeceraRequestDto request) {
        return service.editar(id, request)
                .map(ResponseEntity::ok);
    }

    // PATCH - Eliminar lógico
    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar (Lógico) asignación", description = "Desactiva la asignación.")
    public Mono<ResponseEntity<AsignacionCabeceraResponseDto>> eliminar(@PathVariable Long id) {
        return service.eliminar(id)
                .map(ResponseEntity::ok);
    }

    // PATCH - Restaurar lógico
    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar asignación", description = "Reactiva una asignación previamente desactivada.")
    public Mono<ResponseEntity<AsignacionCabeceraResponseDto>> restaurar(@PathVariable Long id) {
        return service.restaurar(id)
                .map(ResponseEntity::ok);
    }
}
