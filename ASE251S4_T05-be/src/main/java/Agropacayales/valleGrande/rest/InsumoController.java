package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Insumo;
import Agropacayales.valleGrande.service.InsumoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/insumos")
@Tag(name = "Insumo-Controller", description = "Operaciones reactivas de gestión de insumos agrícolas (WebFlux + MongoDB)")
public class InsumoController {

    private final InsumoService insumoService;

    public InsumoController(InsumoService insumoService) {
        this.insumoService = insumoService;
    }

    // GET - Listar todos los insumos (FLUX)
    @GetMapping
    @Operation(summary = "Listar todos los insumos", description = "Obtiene un flujo reactivo con todos los insumos registrados")
    public Flux<Insumo> listarTodos() {
        return insumoService.listarTodos();
    }

    // GET - Listar insumos por estado (FLUX)
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar insumos por estado", description = "Filtra insumos activos o inactivos retornando un Flux")
    public Flux<Insumo> listarPorEstado(@PathVariable Boolean estado) {
        return insumoService.listarPorEstado(estado);
    }

    // GET - Listar insumo por ID (MONO)
    @GetMapping("/{id}")
    @Operation(summary = "Obtener insumo por ID", description = "Busca un insumo específico por su identificador único")
    @ApiResponse(responseCode = "200", description = "Insumo encontrado")
    @ApiResponse(responseCode = "404", description = "Insumo no encontrado")
    public Mono<ResponseEntity<Insumo>> listarPorId(@PathVariable String id) {
        return insumoService.listarPorId(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // POST - Crear nuevo insumo (MONO)
    @PostMapping
    @Operation(summary = "Registrar nuevo insumo", description = "Crea un insumo validando reglas de negocio e integridad")
    @ApiResponse(responseCode = "201", description = "Insumo creado exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o nombre de insumo duplicado")
    public Mono<ResponseEntity<Insumo>> crear(@Valid @RequestBody Insumo insumo) {
        return insumoService.crear(insumo)
                .map(nuevo -> ResponseEntity.status(HttpStatus.CREATED).body(nuevo));
    }

    // PUT - Editar insumo existente (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Actualizar insumo existente", description = "Modifica los datos de un insumo activo existente")
    @ApiResponse(responseCode = "200", description = "Insumo actualizado exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o conflicto de nombre")
    @ApiResponse(responseCode = "404", description = "Insumo no encontrado o inactivo")
    public Mono<ResponseEntity<Insumo>> editar(@PathVariable String id, @Valid @RequestBody Insumo insumo) {
        return insumoService.editar(id, insumo)
                .map(ResponseEntity::ok);
    }

    // PATCH - Eliminar lógico (MONO)
    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar insumo (Lógico)", description = "Desactiva un insumo cambiando su estado a false")
    @ApiResponse(responseCode = "200", description = "Insumo eliminado lógicamente")
    @ApiResponse(responseCode = "404", description = "Insumo no encontrado")
    public Mono<ResponseEntity<Insumo>> eliminar(@PathVariable String id) {
        return insumoService.eliminar(id)
                .map(ResponseEntity::ok);
    }

    // DELETE - Alias para eliminar lógico
    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar insumo por DELETE", description = "Desactiva un insumo cambiando su estado a false")
    public Mono<ResponseEntity<Insumo>> eliminarPorDelete(@PathVariable String id) {
        return insumoService.eliminar(id)
                .map(ResponseEntity::ok);
    }

    // PATCH - Restaurar lógico (MONO)
    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar insumo (Lógico)", description = "Activa nuevamente un insumo previamente inactivo")
    @ApiResponse(responseCode = "200", description = "Insumo restaurado exitosamente")
    @ApiResponse(responseCode = "404", description = "Insumo no encontrado")
    public Mono<ResponseEntity<Insumo>> restaurar(@PathVariable String id) {
        return insumoService.restaurar(id)
                .map(ResponseEntity::ok);
    }

    // GET - Buscar insumos por nombre (FLUX)
    @GetMapping("/buscar")
    @Operation(summary = "Buscar insumos por nombre", description = "Busca insumos cuyo nombre contenga la cadena proporcionada")
    public Flux<Insumo> buscarPorNombre(@RequestParam String nombre) {
        return insumoService.buscarPorNombre(nombre);
    }

    // GET - Filtrar insumos por tipo (FLUX)
    @GetMapping("/filtrar")
    @Operation(summary = "Filtrar insumos por tipo", description = "Filtra insumos según su categoría o tipo")
    public Flux<Insumo> filtrarPorTipo(@RequestParam String tipo) {
        return insumoService.filtrarPorTipo(tipo);
    }

    // POST - Importación masiva CSV
    @PostMapping(value = "/importar/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar insumos desde CSV", description = "Columnas: nombre,descripcion,precio,stock,unidadMedida,tipoInsumo,proveedor,presentacion")
    public Mono<ImportResultDto> importarCsv(@RequestPart("file") FilePart file) {
        return insumoService.importarCsv(file);
    }

    // POST - Importación masiva Excel
    @PostMapping(value = "/importar/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar insumos desde Excel (.xlsx)", description = "Mismas columnas que el CSV, primera hoja")
    public Mono<ImportResultDto> importarExcel(@RequestPart("file") FilePart file) {
        return insumoService.importarExcel(file);
    }

    // GET - Exportar Excel
    @GetMapping({"/exportar/excel", "/excel"})
    @Operation(summary = "Exportar insumos a Excel")
    public Mono<ResponseEntity<byte[]>> exportarExcel() {
        return insumoService.exportarExcel()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=insumos.xlsx")
                        .contentType(MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes));
    }

    // GET - Exportar PDF
    @GetMapping({"/exportar/pdf", "/pdf"})
    @Operation(summary = "Exportar insumos a PDF")
    public Mono<ResponseEntity<byte[]>> exportarPdf() {
        return insumoService.exportarPdf()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=insumos.pdf")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(bytes));
    }
}
