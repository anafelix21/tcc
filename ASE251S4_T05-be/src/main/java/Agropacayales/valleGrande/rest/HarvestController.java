package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.request.HarvestRequestDTO;
import Agropacayales.valleGrande.dto.response.HarvestResponseDTO;
import Agropacayales.valleGrande.service.HarvestService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/harvest")
@RequiredArgsConstructor
@Tag(name = "Harvest-Controller", description = "Módulo Transaccional de Ana Félix: Cosechas y rendimiento de cultivos (WebFlux + SQL Server R2DBC)")
public class HarvestController {

    private final HarvestService harvestService;

    // GET - Listar todas las cosechas (FLUX)
    @GetMapping(value = {"", "/listar"})
    @Operation(summary = "Listar todas las cosechas", description = "Retorna un flujo reactivo con todas las cosechas activas y sus detalles de rendimiento.")
    public Flux<HarvestResponseDTO> listarCosechas() {
        return harvestService.listarTodas();
    }

    // GET - Buscar cosecha por ID (MONO)
    @GetMapping(value = {"/{id}", "/buscar/{id}"})
    @Operation(summary = "Obtener cosecha por ID", description = "Busca una cosecha específica por su ID retornando cabecera y lista de detalles.")
    @ApiResponse(responseCode = "200", description = "Cosecha encontrada")
    @ApiResponse(responseCode = "404", description = "Cosecha no encontrada")
    public Mono<ResponseEntity<HarvestResponseDTO>> obtenerCosecha(@PathVariable Integer id) {
        return harvestService.listarPorId(id)
                .map(ResponseEntity::ok);
    }

    // POST - Registrar nueva cosecha transaccional (MONO)
    @PostMapping(value = {"", "/registrar"})
    @Operation(summary = "Registrar cosecha", description = "Registra de forma atómica una nueva cosecha con sus detalles por ciclo de cultivo en SQL Server.")
    @ApiResponse(responseCode = "201", description = "Cosecha registrada con éxito")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o merma superior al límite permitido")
    public Mono<ResponseEntity<HarvestResponseDTO>> crearCosecha(@Valid @RequestBody HarvestRequestDTO requestDTO) {
        return harvestService.crear(requestDTO)
                .map(nueva -> ResponseEntity.status(HttpStatus.CREATED).body(nueva));
    }

    // PUT - Editar cosecha existente (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Editar cosecha", description = "Actualiza la cabecera y el detalle de rendimiento de una cosecha existente en SQL Server.")
    @ApiResponse(responseCode = "200", description = "Cosecha actualizada con éxito")
    @ApiResponse(responseCode = "404", description = "Cosecha no encontrada")
    public Mono<ResponseEntity<HarvestResponseDTO>> editarCosecha(
            @PathVariable Integer id,
            @Valid @RequestBody HarvestRequestDTO requestDTO) {
        return harvestService.editar(id, requestDTO)
                .map(ResponseEntity::ok);
    }

    // PUT / DELETE - Eliminar lógico
    @PutMapping("/eliminar/{id}")
    @Operation(summary = "Dar de baja cosecha (Lógico)", description = "Cambia el estado de la cosecha a inactivo.")
    public Mono<ResponseEntity<Map<String, String>>> darDeBajaCosecha(@PathVariable Integer id) {
        return harvestService.eliminarLogico(id)
                .thenReturn(ResponseEntity.ok(Map.of("mensaje", "Cosecha dada de baja de manera lógica correctamente.")));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cosecha por ID", description = "Eliminación lógica estándar de cosecha.")
    public Mono<ResponseEntity<Void>> eliminarCosecha(@PathVariable Integer id) {
        return harvestService.eliminarLogico(id)
                .thenReturn(ResponseEntity.noContent().build());
    }
}
