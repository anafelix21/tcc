package Agropacayales.valleGrande.rest;

import Agropacayales.valleGrande.dto.response.ImportResultDto;
import Agropacayales.valleGrande.model.Parcela;
import Agropacayales.valleGrande.service.ParcelaService;
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
@RequestMapping("/api/parcelas")
@RequiredArgsConstructor
@Tag(name = "Parcela-Controller", description = "Gestión reactiva de parcelas y terrenos de cultivo (WebFlux + MongoDB)")
public class ParcelaController {

    private final ParcelaService parcelaService;

    // GET - Listar todas las parcelas (FLUX)
    @GetMapping
    @Operation(summary = "Listar parcelas", description = "Obtiene un flujo reactivo con todas las parcelas")
    public Flux<Parcela> listarTodos() {
        return parcelaService.listarTodos();
    }

    // GET - Listar parcelas por ID (MONO)
    @GetMapping("/{id}")
    @Operation(summary = "Buscar parcela por ID", description = "Obtiene una parcela específica por su ID")
    @ApiResponse(responseCode = "200", description = "Parcela encontrada")
    @ApiResponse(responseCode = "404", description = "Parcela no encontrada")
    public Mono<ResponseEntity<Parcela>> listarPorId(@PathVariable String id) {
        return parcelaService.listarPorId(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    // GET - Listar parcelas por estado (FLUX)
    @GetMapping("/estado/{estado}")
    @Operation(summary = "Listar parcelas por estado", description = "Filtra parcelas activas o inactivas retornando un Flux")
    public Flux<Parcela> listarPorEstado(@PathVariable Boolean estado) {
        return parcelaService.listarPorEstado(estado);
    }

    // POST - Crear nueva parcela (MONO)
    @PostMapping
    @Operation(summary = "Crear parcela", description = "Registra una nueva parcela en la base de datos reactiva")
    @ApiResponse(responseCode = "201", description = "Parcela creada exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos o nombre duplicado")
    public Mono<ResponseEntity<Parcela>> crear(@Valid @RequestBody Parcela parcela) {
        return parcelaService.crear(parcela)
                .map(nueva -> ResponseEntity.status(HttpStatus.CREATED).body(nueva));
    }

    // PUT - Editar parcela existente (MONO)
    @PutMapping("/{id}")
    @Operation(summary = "Editar parcela", description = "Modifica los datos de una parcela existente")
    @ApiResponse(responseCode = "200", description = "Parcela modificada exitosamente")
    @ApiResponse(responseCode = "400", description = "Datos inválidos o conflicto de nombre")
    @ApiResponse(responseCode = "404", description = "Parcela no encontrada")
    public Mono<ResponseEntity<Parcela>> editar(@PathVariable String id, @Valid @RequestBody Parcela parcela) {
        return parcelaService.editar(id, parcela)
                .map(ResponseEntity::ok);
    }

    // PATCH - Eliminar lógico (MONO)
    @PatchMapping("/{id}/eliminar")
    @Operation(summary = "Eliminar parcela (Lógico)", description = "Desactiva la parcela cambiando su estado a false")
    @ApiResponse(responseCode = "200", description = "Parcela desactivada lógicamente")
    @ApiResponse(responseCode = "404", description = "Parcela no encontrada")
    public Mono<ResponseEntity<Parcela>> eliminar(@PathVariable String id) {
        return parcelaService.eliminar(id)
                .map(ResponseEntity::ok);
    }

    // PATCH - Restaurar lógico (MONO)
    @PatchMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar parcela (Lógico)", description = "Reactiva la parcela cambiando su estado a true")
    @ApiResponse(responseCode = "200", description = "Parcela reactivada lógicamente")
    @ApiResponse(responseCode = "404", description = "Parcela no encontrada")
    public Mono<ResponseEntity<Parcela>> restaurar(@PathVariable String id) {
        return parcelaService.restaurar(id)
                .map(ResponseEntity::ok);
    }

    // POST - Importación masiva CSV
    @PostMapping(value = "/importar/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar parcelas desde CSV", description = "Columnas: nombre,ubicacion,areaHectareas,tipoSuelo,responsable,estadoRiego,fechaUltimaSiembra,produccionEstimada,cultivoActual,observaciones")
    public Mono<ImportResultDto> importarCsv(@RequestPart("file") FilePart file) {
        return parcelaService.importarCsv(file);
    }

    // POST - Importación masiva Excel
    @PostMapping(value = "/importar/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Importar parcelas desde Excel (.xlsx)", description = "Mismas columnas que el CSV, primera hoja")
    public Mono<ImportResultDto> importarExcel(@RequestPart("file") FilePart file) {
        return parcelaService.importarExcel(file);
    }

    // GET - Exportar Excel
    @GetMapping("/exportar/excel")
    @Operation(summary = "Exportar parcelas a Excel")
    public Mono<ResponseEntity<byte[]>> exportarExcel() {
        return parcelaService.exportarExcel()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=parcelas.xlsx")
                        .contentType(MediaType.parseMediaType(
                                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(bytes));
    }

    // GET - Exportar PDF
    @GetMapping("/exportar/pdf")
    @Operation(summary = "Exportar parcelas a PDF")
    public Mono<ResponseEntity<byte[]>> exportarPdf() {
        return parcelaService.exportarPdf()
                .map(bytes -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=parcelas.pdf")
                        .contentType(MediaType.APPLICATION_PDF)
                        .body(bytes));
    }
}
